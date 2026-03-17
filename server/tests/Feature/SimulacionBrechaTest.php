<?php

namespace Tests\Feature;

use App\Models\Celda;
use App\Models\Dinosaurio;
use App\Models\Especie;
use App\Models\User;
use App\Models\InformeSimulacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class SimulacionBrechaTest extends TestCase
{
    use RefreshDatabase;

    private function crearAdmin(): User
    {
        return User::create([
            'nick' => 'admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('Admin123!'),
            'rol' => 'Administrador',
        ]);
    }

    private function crearVeterinario(): User
    {
        return User::create([
            'nick' => 'vet',
            'email' => 'vet@test.com',
            'password' => bcrypt('Vet123!'),
            'rol' => 'Veterinario',
        ]);
    }

    private function tokenDe(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    private function crearCeldaSegura(): Celda
    {
        return Celda::create([
            'fila' => 1,
            'columna' => 1,
            'nivel_seguridad' => 'Extremo',
            'alimento_porcentaje' => 100,
            'averias_pendientes' => 0,
        ]);
    }

    private function crearCeldaInsegura(): Celda
    {
        return Celda::create([
            'fila' => 1,
            'columna' => 2,
            'nivel_seguridad' => 'Bajo',
            'alimento_porcentaje' => 10,
            'averias_pendientes' => 5,
        ]);
    }

    // ─── Tests ────────────────────────────────────────────────────────────────

    public function test_admin_puede_lanzar_simulacion_brecha_aleatoria()
    {
        $admin = $this->crearAdmin();
        $this->crearCeldaSegura();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['informe_id', 'celda_id', 'puntuacion', 'factores', 'resultado', 'brecha_contenida'],
        ]);
    }

    public function test_admin_puede_lanzar_simulacion_brecha_en_celda_concreta()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCeldaSegura();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha', ['celda_id' => $celda->id]);

        $response->assertStatus(200);
        $this->assertEquals($celda->id, $response->json('data.celda_id'));
    }

    public function test_veterinario_no_puede_lanzar_simulacion_brecha()
    {
        $vet = $this->crearVeterinario();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/simulaciones/brecha');

        $response->assertStatus(403);
    }

    public function test_celda_segura_contiene_la_brecha()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCeldaSegura();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha', ['celda_id' => $celda->id]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.brecha_contenida'));
    }

    public function test_celda_insegura_con_dinos_peligrosos_no_contiene_la_brecha()
    {
        $admin  = $this->crearAdmin();
        $celda  = $this->crearCeldaInsegura();

        $especie = Especie::create([
            'nombre' => 'Indominus rex',
            'dieta' => 'Carnivoros',
            'peligrosidad' => 'Critico',
        ]);

        Dinosaurio::create(['nick' => 'Rex1', 'edad' => 5, 'especie_id' => $especie->id, 'celda_id' => $celda->id]);
        Dinosaurio::create(['nick' => 'Rex2', 'edad' => 3, 'especie_id' => $especie->id, 'celda_id' => $celda->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha', ['celda_id' => $celda->id]);

        $response->assertStatus(200);
        $this->assertFalse($response->json('data.brecha_contenida'));
    }

    public function test_brecha_crea_informe()
    {
        $admin = $this->crearAdmin();
        $this->crearCeldaSegura();

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha');

        $this->assertDatabaseHas('informe_simulacions', ['tipo' => 'Brecha']);
    }

    public function test_brecha_no_contenida_crea_tarea_emergencia()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCeldaInsegura();

        $especie = Especie::create([
            'nombre' => 'Indominus rex',
            'dieta' => 'Carnivoros',
            'peligrosidad' => 'Critico',
        ]);

        Dinosaurio::create(['nick' => 'Rex1', 'edad' => 5, 'especie_id' => $especie->id, 'celda_id' => $celda->id]);
        Dinosaurio::create(['nick' => 'Rex2', 'edad' => 3, 'especie_id' => $especie->id, 'celda_id' => $celda->id]);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha', ['celda_id' => $celda->id]);

        $this->assertDatabaseHas('tareas', ['tipo' => 'Emergencia: brecha de seguridad']);
    }

    public function test_brecha_sin_celdas_devuelve_error()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/brecha');

        $response->assertStatus(422);
    }
}