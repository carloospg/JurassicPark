<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use \App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'nick' => 'admin',
            'email' => 'admin@jurassicpark.com',
            'password' => bcrypt('admin'),
            'rol' => 'Administrador',
            'foto' => 'https://res.cloudinary.com/dgznikiob/image/upload/v1772707938/fotoperfil_hmislm.png',
        ]);
    }
}
