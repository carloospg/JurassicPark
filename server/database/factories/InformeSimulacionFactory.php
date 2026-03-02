<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InformeSimulacion>
 */
class InformeSimulacionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tipo' => fake()->randomElement(['Normal', 'Brecha']),
            'detalles' => json_encode(['resultado' => 'Simulación de prueba', 'bajas' => fake()->numberBetween(0, 5)]),
        ];
    }
}
