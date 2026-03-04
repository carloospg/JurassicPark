<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Celda extends Model
{
    /** @use HasFactory<\Database\Factories\CeldaFactory> */
    use HasFactory;

    protected $fillable = [
        'fila',
        'columna',
        'nivel_seguridad',
        'alimento_porcentaje',
        'averias_pendientes',
    ];

    public function dinosaurios() {
        return $this->hasMany(Dinosaurio::class);
    }

    public function tareas() {
        return $this->hasMany(Tarea::class);
    }
}
