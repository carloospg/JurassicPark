<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Dinosaurio>
 */
class DinosaurioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nick' => fake()->firstName() . 'saurus',
            'edad' => fake()->numberBetween(1, 30),
            'especie_id' => \App\Models\Especie::inRandomOrder()->first()->id ?? 1,
            'celda_id' => \App\Models\Celda::inRandomOrder()->first()->id ?? 1,
        ];
    }
}
