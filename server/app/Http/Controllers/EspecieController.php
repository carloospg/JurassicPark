<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Especie;

class EspecieController extends Controller
{
    public function getEspecies() {
        $especies = Especie::orderBy('nombre')->get();
 
        return response()->json([
            'success' => true,
            'data'    => $especies,
        ], 200);
    }
}
