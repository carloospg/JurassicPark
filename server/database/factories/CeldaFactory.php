<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Celda>
 */
class CeldaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'fila' => fake()->numberBetween(1, 10),
            'columna' => fake()->numberBetween(1, 10),
            'nivel_seguridad' => fake()->randomElement(['Bajo', 'Medio', 'Alto', 'Extremo']),
            'alimento_porcentaje' => fake()->numberBetween(20, 100),
            'averias_pendientes' => fake()->numberBetween(0, 3),
        ];
    }
}
