<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tarea>
 */
class TareaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tipo' => fake()->randomElement(['Alimentar', 'Reparar valla', 'Curar dinosaurio', 'Limpieza']),
            'estado' => fake()->randomElement(['Pendiente', 'En progreso', 'Finalizada']),
            'celda_id' => \App\Models\Celda::inRandomOrder()->first()->id ?? 1,
        ];
    }
}
