<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InformeSimulacion extends Model
{
    /** @use HasFactory<\Database\Factories\InformeSimulacionFactory> */
    use HasFactory;

    protected $table = "informe_simulacion";

    protected $fillable = [
        'fecha_simulacion',
        'tipo',
        'detalles',
    ];

    protected $casts = [
        'detalles' => 'array',
    ];
}
