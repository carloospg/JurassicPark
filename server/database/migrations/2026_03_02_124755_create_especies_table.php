<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('especies', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->enum('dieta', ['Herbivoros', 'Omnivoros', 'Carnivoros']);
            $table->enum('peligrosidad', ['Bajo', 'Medio', 'Alto', 'Muy Alto', 'Extremo', 'Critico']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('especies');
    }
};
