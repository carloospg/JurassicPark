<?php

namespace Tests\Feature;

use App\Models\Celda;
use App\Models\Dinosaurio;
use App\Models\Especie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class DinosaurioTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────

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

    private function crearEspecie(): Especie
    {
        return Especie::create([
            'nombre' => 'Velociraptor',
            'dieta' => 'Carnivoros',
            'peligrosidad' => 'Muy Alto',
        ]);
    }

    private function crearCelda(): Celda
    {
        return Celda::create([
            'fila' => 1,
            'columna' => 1,
            'nivel_seguridad' => 'Alto',
            'alimento_porcentaje' => 100,
            'averias_pendientes' => 0,
        ]);
    }

    private function crearDinosaurio(int $especieId, ?int $celdaId = null): Dinosaurio
    {
        return Dinosaurio::create([
            'nick' => 'Rex',
            'edad' => 5,
            'especie_id' => $especieId,
            'celda_id' => $celdaId,
        ]);
    }

    // ─── getDinosaurios ───────────────────────────────────────

    public function test_cualquier_usuario_puede_listar_dinosaurios()
    {
        $vet = $this->crearVeterinario();
        $especie = $this->crearEspecie();
        $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/dinosaurios');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [['id', 'nick', 'edad', 'especie_id', 'celda_id']],
        ]);
    }

    public function test_puede_filtrar_dinosaurios_por_celda()
    {
        $admin = $this->crearAdmin();
        $especie = $this->crearEspecie();
        $celda = $this->crearCelda();
        $this->crearDinosaurio($especie->id, $celda->id);
        $this->crearDinosaurio($especie->id); // sin celda

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->getJson('/api/dinosaurios?celda_id=' . $celda->id);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_no_autenticado_no_puede_listar_dinosaurios()
    {
        $response = $this->getJson('/api/dinosaurios');
        $response->assertStatus(401);
    }

    // ─── getDinosaurio ────────────────────────────────────────

    public function test_cualquier_usuario_puede_ver_detalle_dinosaurio()
    {
        $vet = $this->crearVeterinario();
        $especie = $this->crearEspecie();
        $dinosaurio = $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/dinosaurios/' . $dinosaurio->id);

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $dinosaurio->id]);
    }

    public function test_detalle_dinosaurio_devuelve_404_si_no_existe()
    {
        $vet = $this->crearVeterinario();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->getJson('/api/dinosaurios/9999');

        $response->assertStatus(404);
    }

    // ─── createDinosaurio ─────────────────────────────────────

    public function test_admin_puede_crear_dinosaurio_sin_celda()
    {
        $admin   = $this->crearAdmin();
        $especie = $this->crearEspecie();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/dinosaurios', [
            'nick' => 'Blue',
            'edad' => 3,
            'especie_id' => $especie->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('dinosaurios', ['nick' => 'Blue']);
    }

    public function test_admin_puede_crear_dinosaurio_con_celda()
    {
        $admin = $this->crearAdmin();
        $especie = $this->crearEspecie();
        $celda = $this->crearCelda();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/dinosaurios', [
            'nick' => 'Delta',
            'edad' => 4,
            'especie_id' => $especie->id,
            'celda_id' => $celda->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('dinosaurios', [
            'nick' => 'Delta',
            'celda_id' => $celda->id,
        ]);
    }

    public function test_veterinario_no_puede_crear_dinosaurio()
    {
        $vet     = $this->crearVeterinario();
        $especie = $this->crearEspecie();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/dinosaurios', [
            'nick' => 'Blue',
            'edad' => 3,
            'especie_id' => $especie->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_fallo_crear_dinosaurio_especie_inexistente()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/dinosaurios', [
            'nick' => 'Blue',
            'edad' => 3,
            'especie_id' => 9999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errores' => ['especie_id']]);
    }

    // ─── updateDinosaurio ─────────────────────────────────────

    public function test_admin_puede_editar_dinosaurio()
    {
        $admin = $this->crearAdmin();
        $especie = $this->crearEspecie();
        $dinosaurio = $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/dinosaurios/' . $dinosaurio->id, [
            'nick' => 'Blue Editado',
            'edad' => 6,
            'especie_id' => $especie->id,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('dinosaurios', [
            'id' => $dinosaurio->id,
            'nick' => 'Blue Editado',
            'edad' => 6,
        ]);
    }

    public function test_admin_puede_quitar_celda_de_dinosaurio()
    {
        $admin = $this->crearAdmin();
        $especie = $this->crearEspecie();
        $celda = $this->crearCelda();
        $dinosaurio = $this->crearDinosaurio($especie->id, $celda->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->postJson('/api/dinosaurios/' . $dinosaurio->id, [
            'nick' => $dinosaurio->nick,
            'edad' => $dinosaurio->edad,
            'especie_id' => $especie->id,
            'celda_id' => null,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('dinosaurios', [
            'id' => $dinosaurio->id,
            'celda_id' => null,
        ]);
    }

    public function test_veterinario_no_puede_editar_dinosaurio()
    {
        $vet        = $this->crearVeterinario();
        $especie    = $this->crearEspecie();
        $dinosaurio = $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->postJson('/api/dinosaurios/' . $dinosaurio->id, [
            'nick' => 'Editado',
            'edad' => 6,
            'especie_id' => $especie->id,
        ]);

        $response->assertStatus(403);
    }

    // ─── deleteDinosaurio ─────────────────────────────────────

    public function test_admin_puede_eliminar_dinosaurio()
    {
        $admin = $this->crearAdmin();
        $especie = $this->crearEspecie();
        $dinosaurio = $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->deleteJson('/api/dinosaurios/' . $dinosaurio->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('dinosaurios', ['id' => $dinosaurio->id]);
    }

    public function test_veterinario_no_puede_eliminar_dinosaurio()
    {
        $vet = $this->crearVeterinario();
        $especie = $this->crearEspecie();
        $dinosaurio = $this->crearDinosaurio($especie->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($vet),
        ])->deleteJson('/api/dinosaurios/' . $dinosaurio->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('dinosaurios', ['id' => $dinosaurio->id]);
    }

    public function test_eliminar_dinosaurio_inexistente_devuelve_404()
    {
        $admin = $this->crearAdmin();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenDe($admin),
        ])->deleteJson('/api/dinosaurios/9999');

        $response->assertStatus(404);
    }
}
