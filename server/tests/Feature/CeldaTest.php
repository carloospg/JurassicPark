<?php

namespace Tests\Feature;

use App\Models\Celda;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class CeldaTest extends TestCase
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

    private function crearCelda(int $fila = 1, int $columna = 1): Celda
    {
        return Celda::create([
            'fila'                => $fila,
            'columna'             => $columna,
            'nivel_seguridad'     => 'Alto',
            'alimento_porcentaje' => 100,
            'averias_pendientes'  => 0,
        ]);
    }

    public function test_cualquier_usuario_puede_listar_celdas()
    {
        $vet = $this->crearVeterinario();
        $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/celdas');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [['id', 'fila', 'columna', 'nivel_seguridad', 'alimento_porcentaje', 'averias_pendientes']],
        ]);
    }

    public function test_no_autenticado_no_puede_listar_celdas()
    {
        $response = $this->getJson('/api/celdas');
        $response->assertStatus(401);
    }


    public function test_cualquier_usuario_puede_ver_detalle_celda()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/celdas/' . $celda->id);

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $celda->id]);
    }

    public function test_show_devuelve_404_si_no_existe()
    {
        $vet = $this->crearVeterinario();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/celdas/9999');

        $response->assertStatus(404);
    }


    public function test_admin_puede_crear_celda()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/celdas', [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Alto',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('celdas', ['fila' => 1, 'columna' => 1]);
    }

    public function test_veterinario_no_puede_crear_celda()
    {
        $vet = $this->crearVeterinario();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/celdas', [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Alto',
        ]);

        $response->assertStatus(403);
    }

    public function test_fallo_crear_celda_posicion_duplicada()
    {
        $admin = $this->crearAdmin();
        $this->crearCelda(2, 3);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/celdas', [
            'fila'            => 2,
            'columna'         => 3,
            'nivel_seguridad' => 'Bajo',
        ]);

        $response->assertStatus(422);
    }

    public function test_fallo_crear_celda_nivel_seguridad_invalido()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/celdas', [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Invisible',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errores' => ['nivel_seguridad']]);
    }

    public function test_admin_puede_editar_celda()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/celdas/' . $celda->id, [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Extremo',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('celdas', [
            'id'              => $celda->id,
            'nivel_seguridad' => 'Extremo',
        ]);
    }

    public function test_fallo_editar_celda_posicion_ya_ocupada()
    {
        $admin  = $this->crearAdmin();
        $celda1 = $this->crearCelda(1, 1);
        $celda2 = $this->crearCelda(2, 2);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/celdas/' . $celda2->id, [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Bajo',
        ]);

        $response->assertStatus(422);
    }

    public function test_veterinario_no_puede_editar_celda()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/celdas/' . $celda->id, [
            'fila'            => 1,
            'columna'         => 1,
            'nivel_seguridad' => 'Bajo',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_puede_eliminar_celda()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->deleteJson('/api/celdas/' . $celda->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('celdas', ['id' => $celda->id]);
    }

    public function test_veterinario_no_puede_eliminar_celda()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->deleteJson('/api/celdas/' . $celda->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('celdas', ['id' => $celda->id]);
    }

    public function test_eliminar_celda_inexistente_devuelve_404()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->deleteJson('/api/celdas/9999');

        $response->assertStatus(404);
    }
}