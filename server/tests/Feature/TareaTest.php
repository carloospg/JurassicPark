<?php

namespace Tests\Feature;

use App\Models\Celda;
use App\Models\Tarea;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class TareaTest extends TestCase
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

    private function crearMantenimiento(): User
    {
        return User::create([
            'nick'     => 'mant',
            'email'    => 'mant@test.com',
            'password' => bcrypt('Mant123!'),
            'rol'      => 'Mantenimiento',
        ]);
    }

    private function tokenDe(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    private function crearCelda(): Celda
    {
        return Celda::create([
            'fila'                => 1,
            'columna'             => 1,
            'nivel_seguridad'     => 'Alto',
            'alimento_porcentaje' => 100,
            'averias_pendientes'  => 0,
        ]);
    }

    private function crearTarea(int $celdaId, string $estado = 'Pendiente'): Tarea
    {
        return Tarea::create([
            'tipo'     => 'Revision veterinaria',
            'estado'   => $estado,
            'celda_id' => $celdaId,
        ]);
    }

    public function test_admin_ve_todas_las_tareas()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda();
        $this->crearTarea($celda->id);
        $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->getJson('/api/tareas');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_veterinario_solo_ve_sus_tareas()
    {
        $vet  = $this->crearVeterinario();
        $vet2 = User::create([
            'nick'     => 'vet2',
            'email'    => 'vet2@test.com',
            'password' => bcrypt('Vet123!'),
            'rol'      => 'Veterinario',
        ]);

        $celda  = $this->crearCelda();
        $tarea1 = $this->crearTarea($celda->id);
        $tarea2 = $this->crearTarea($celda->id);

        $tarea1->usuarios()->attach($vet->id);
        $tarea2->usuarios()->attach($vet2->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/tareas');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }


    public function test_admin_puede_crear_tarea()
    {
        $admin = $this->crearAdmin();
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/tareas', [
            'tipo'         => 'Revision veterinaria',
            'celda_id'     => $celda->id,
            'usuarios_ids' => [$vet->id],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tareas', ['tipo' => 'Revision veterinaria', 'estado' => 'Pendiente']);
    }

    public function test_veterinario_no_puede_crear_tarea()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/tareas', [
            'tipo'     => 'Revision',
            'celda_id' => $celda->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_usuario_asignado_puede_avanzar_estado()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);
        $tarea->usuarios()->attach($vet->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->patchJson('/api/tareas/' . $tarea->id . '/estado', [
            'estado' => 'En progreso',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tareas', ['id' => $tarea->id, 'estado' => 'En progreso']);
    }

    public function test_no_se_puede_saltar_estado()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);
        $tarea->usuarios()->attach($vet->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->patchJson('/api/tareas/' . $tarea->id . '/estado', [
            'estado' => 'Finalizada',
        ]);

        $response->assertStatus(422);
    }

    public function test_usuario_no_asignado_no_puede_cambiar_estado()
    {
        $vet   = $this->crearVeterinario();
        $vet2  = $this->crearMantenimiento();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $tarea->usuarios()->attach($vet->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet2),
        ])->patchJson('/api/tareas/' . $tarea->id . '/estado', [
            'estado' => 'En progreso',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_puede_cambiar_estado_de_cualquier_tarea()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->patchJson('/api/tareas/' . $tarea->id . '/estado', [
            'estado' => 'En progreso',
        ]);

        $response->assertStatus(200);
    }


    // ─── updateTarea ──────────────────────────────────────────

    public function test_admin_puede_editar_tarea()
    {
        $admin = $this->crearAdmin();
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/tareas/' . $tarea->id, [
            'tipo'         => 'Tipo actualizado',
            'celda_id'     => $celda->id,
            'usuarios_ids' => [$vet->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tareas', ['id' => $tarea->id, 'tipo' => 'Tipo actualizado']);
    }

    public function test_veterinario_no_puede_editar_tarea()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/tareas/' . $tarea->id, [
            'tipo'     => 'Intento edicion',
            'celda_id' => $celda->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_editar_tarea_actualiza_usuarios_asignados()
    {
        $admin = $this->crearAdmin();
        $vet   = $this->crearVeterinario();
        $mant  = $this->crearMantenimiento();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);
        $tarea->usuarios()->attach($vet->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/tareas/' . $tarea->id, [
            'tipo'         => $tarea->tipo,
            'celda_id'     => $celda->id,
            'usuarios_ids' => [$mant->id],
        ]);

        $response->assertStatus(200);
        // Ahora solo debe estar el de mantenimiento
        $this->assertDatabaseHas('tarea_usuario', ['tarea_id' => $tarea->id, 'user_id' => $mant->id]);
        $this->assertDatabaseMissing('tarea_usuario', ['tarea_id' => $tarea->id, 'user_id' => $vet->id]);
    }

    // ─── deleteTarea ──────────────────────────────────────────

    public function test_admin_puede_eliminar_tarea()
    {
        $admin = $this->crearAdmin();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->deleteJson('/api/tareas/' . $tarea->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('tareas', ['id' => $tarea->id]);
    }

    public function test_veterinario_no_puede_eliminar_tarea()
    {
        $vet   = $this->crearVeterinario();
        $celda = $this->crearCelda();
        $tarea = $this->crearTarea($celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->deleteJson('/api/tareas/' . $tarea->id);

        $response->assertStatus(403);
    }
}
