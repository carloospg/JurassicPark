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
        Schema::create('dinosaurios', function (Blueprint $table) {
            $table->id();
            $table->string('nick');
            $table->integer('edad');
            $table->foreignId('especie_id')->constrained('especies')->onDelete('cascade');
            $table->foreignId('celda_id')->nullable()->constrained('celdas')->onDelete('set null'); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dinosaurios');
    }
};
