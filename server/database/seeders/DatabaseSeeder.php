<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            UserSeeder::class,
            EspecieSeeder::class,
        ]);

        \App\Models\User::factory(10)->create();
        \App\Models\Celda::factory(20)->create();
        \App\Models\Dinosaurio::factory(50)->create();
        \App\Models\Tarea::factory(30)->create();
    }
}
