<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Especie extends Model
{
    /** @use HasFactory<\Database\Factories\EspecieFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
        'dieta',
        'peligrosidad',
    ];

    public function dinosaurios() {
        return $this->hasMany(Dinosaurio::class);
    }
}
