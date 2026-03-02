<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Especie;

class EspecieSeeder extends Seeder
{
    public function run(): void
    {
        $especies = [
            ['nombre' => 'Triceratops', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Medio'],
            ['nombre' => 'Brachiosaurus', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Bajo'],
            ['nombre' => 'Stegosaurus', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Medio'],
            ['nombre' => 'Ankylosaurus', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Medio'],
            ['nombre' => 'Parasaurolophus', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Bajo'],
            ['nombre' => 'Gallimimus', 'dieta' => 'Herbivoros', 'peligrosidad' => 'Bajo'],
            
            ['nombre' => 'Oviraptor', 'dieta' => 'Omnivoros', 'peligrosidad' => 'Medio'],
            ['nombre' => 'Ornitholestes', 'dieta' => 'Omnivoros', 'peligrosidad' => 'Medio'],
            ['nombre' => 'Therizinosaurus', 'dieta' => 'Omnivoros', 'peligrosidad' => 'Alto'],
            
            ['nombre' => 'Velociraptor', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Muy Alto'],
            ['nombre' => 'Dilophosaurus', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Muy Alto'],
            ['nombre' => 'Carnotaurus', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Muy Alto'],
            ['nombre' => 'Allosaurus', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Muy Alto'],
            ['nombre' => 'Tyrannosaurus rex', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Extremo'],
            ['nombre' => 'Spinosaurus', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Extremo'],
            ['nombre' => 'Giganotosaurus', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Extremo'],
            ['nombre' => 'Indominus rex', 'dieta' => 'Carnivoros', 'peligrosidad' => 'Critico'],
        ];

        foreach ($especies as $especie) {
            Especie::create($especie);
        }
    }
}