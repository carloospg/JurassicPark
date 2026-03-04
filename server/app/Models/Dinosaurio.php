<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dinosaurio extends Model
{
    /** @use HasFactory<\Database\Factories\DinosaurioFactory> */
    use HasFactory;

    protected $fillable = [
        'nick',
        'edad',
        'especie_id',
        'celda_id',
    ];

    public function especie() {
        return $this->belongsTo(Especie::class);
    }
    
    public function celda() {
        return $this->belongsTo(Celda::class);
    }
}
