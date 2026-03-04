<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    /** @use HasFactory<\Database\Factories\TareaFactory> */
    use HasFactory;

    protected $fillable = [
        'tipo',
        'estado',
        'celda_id',
    ];

    public function celda() {
        return $this->belongsTo(Celda::class);
    }

    public function usuarios() {
        return $this->belongsToMany(User::class, 'tarea_usuario');
    }
}
