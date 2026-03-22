<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthTest extends TestCase
{

    use RefreshDatabase;

    public function test_registro_correcto()
    {
        $response = $this->postJson('/api/registro', [
            'nick' => 'test',
            'email' => 'test@test.com',
            'password' => 'test123',
            'password_confirmation' => 'test123',
        ]);

        $response->assertStatus(201);

        $response->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'nick',
                'email',
                'rol',
                'token',
                'foto',
            ],
            'message',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@test.com',
            'nick' => 'test'
        ]);
    }

    public function test_fallo_registro_confirmacion_password_incorrecta()
    {
        $response = $this->postJson('/api/registro', [
            'nick' => 'testError',
            'email' => 'error@test.com',
            'password' => 'error123',
            'password_confirmation' => 'tet321',
        ]);

        $response->assertStatus(422);

        $response->assertJson([
            'success' => false,
        ]);
        
        $response->assertJsonStructure([
            'success',
            'errores' => [
                'password'
            ]
        ]);
    }

    public function test_fallo_registro_email_ya_existente()
    {
        User::create([
            'nick' => 'test',
            'email' => 'test@test.com',
            'password' => bcrypt('test123'),
            'rol' => 'Veterinario'
        ]);

        $response = $this->postJson('/api/registro', [
            'nick' => 'test',
            'email' => 'test@test.com',
            'password' => 'test123',
            'password_confirmation' => 'test123',
        ]);

        $response->assertStatus(422);

        $response->assertJson([
            'success' => false,
        ]);

        $response->assertJsonStructure([
            'success',
            'errores' => [
                'email'
            ]
        ]);
    }

    public function test_iniciar_sesion_correctamente()
    {
        User::create([
            'nick' => 'AdminLogin',
            'email' => 'login@test.com',
            'password' => bcrypt('Contrasenia123?'),
            'rol' => 'Veterinario'
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@test.com',
            'password' => 'Contrasenia123?',
        ]);

        $response->assertStatus(200);

        $response->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'nick',
                'email',
                'rol',
                'token',
                'foto',
            ],
            'message',
        ]);
    }

    public function test_fallo_iniciar_sesion_password_incorrecta()
    {
        User::create([
            'nick' => 'FalloLogin',
            'email' => 'fallo@test.com',
            'password' => bcrypt('Contrasenia123?'),
            'rol' => 'Veterinario'
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'fallo@test.com',
            'password' => 'ContraseniaEquivocada!',
        ]);

        $response->assertStatus(401);

        $response->assertJson([
            'success' => false,
            'message' => 'Credenciales incorrectas',
        ]);
    }

    public function test_fallo_iniciar_sesion_validacion_datos()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'no-es-un-correo',
            'password' => '',
        ]);

        $response->assertStatus(422);

        $response->assertJsonStructure([
            'success',
            'errores' => [
                'email',
                'password'
            ]
        ]);
    }

    public function test_actualizar_perfil_correctamente()
    {
        $user = User::create([
            'nick' => 'DrGrant',
            'email' => 'grant@test.com',
            'password' => bcrypt('Contrasenia123?'),
            'rol' => 'Veterinario'
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/perfil/actualizar', [
            'nick' => 'AlanGrant',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['id', 'nick', 'email', 'rol', 'foto'],
            'message'
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'nick' => 'AlanGrant'
        ]);
    }

    public function test_fallo_actualizar_perfil_nick_duplicado()
    {
        User::create([
            'nick' => 'UsuarioUno',
            'email' => 'uno@test.com',
            'password' => bcrypt('Pass123!'),
            'rol' => 'Veterinario'
        ]);

        $userDos = User::create([
            'nick' => 'UsuarioDos',
            'email' => 'dos@test.com',
            'password' => bcrypt('Pass123!'),
            'rol' => 'Veterinario'
        ]);

        $token = JWTAuth::fromUser($userDos);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/perfil/actualizar', [
            'nick' => 'UsuarioUno',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'success',
            'errores' => ['nick']
        ]);
    }

    public function test_fallo_actualizar_perfil_sin_token()
    {
        $response = $this->postJson('/api/perfil/actualizar', [
            'nick' => 'HackerNinja',
        ]);

        $response->assertStatus(401);
    }
}
