<?php

namespace Tests\Feature;

use App\Models\Celda;
use App\Models\User;
use App\Models\InformeSimulacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class SimulacionNormalTest extends TestCase
{
    use RefreshDatabase;

    private function crearAdmin(): User
    {
        return User::create([
            'nick'     => 'admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('Admin123!'),
            'rol'      => 'Administrador',
        ]);
    }

    private function crearVeterinario(): User
    {
        return User::create([
            'nick'     => 'vet',
            'email'    => 'vet@test.com',
            'password' => bcrypt('Vet123!'),
            'rol'      => 'Veterinario',
        ]);
    }

    private function tokenDe(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    private function crearCelda(int $fila = 1, int $columna = 1, int $alimento = 100): Celda
    {
        return Celda::create([
            'fila'                => $fila,
            'columna'             => $columna,
            'nivel_seguridad'     => 'Alto',
            'alimento_porcentaje' => $alimento,
            'averias_pendientes'  => 0,
        ]);
    }

    public function test_admin_puede_lanzar_simulacion_normal()
    {
        $admin = $this->crearAdmin();
        $this->crearCelda(1, 1);
        $this->crearCelda(1, 2);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/normal');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['informe_id', 'total_celdas', 'tareas_creadas', 'celdas'],
        ]);
    }

    public function test_veterinario_no_puede_lanzar_simulacion_normal()
    {
        $vet = $this->crearVeterinario();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/simulaciones/normal');

        $response->assertStatus(403);
    }

    public function test_simulacion_baja_el_alimento_de_las_celdas()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda(1, 1, 100);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/normal');

        $celda->refresh();
        $this->assertLessThan(100, $celda->alimento_porcentaje);
    }

    public function test_simulacion_crea_informe()
    {
        $admin = $this->crearAdmin();
        $this->crearCelda();

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/normal');

        $this->assertDatabaseCount('informe_simulacions', 1);
        $this->assertDatabaseHas('informe_simulacions', ['tipo' => 'Normal']);
    }

    public function test_simulacion_crea_tarea_si_alimento_es_critico()
    {
        $admin = $this->crearAdmin();
        $this->crearCelda(1, 1, 25);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/simulaciones/normal');

        $this->assertDatabaseHas('tareas', ['tipo' => 'Alimentacion urgente']);
    }

    public function test_admin_puede_ver_informes()
    {
        $admin = $this->crearAdmin();

        InformeSimulacion::create([
            'tipo'     => 'Normal',
            'detalles' => ['total_celdas' => 5],
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->getJson('/api/simulaciones/informes');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}