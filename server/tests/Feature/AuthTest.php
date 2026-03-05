<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

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
}
