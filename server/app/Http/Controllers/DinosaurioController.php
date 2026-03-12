<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Dinosaurio;
use App\Models\Celda;
use App\Models\Especie;
use Illuminate\Support\Facades\Validator;

class DinosaurioController extends Controller
{
    private function isAdmin() {
        $user = auth('api')->user();
        return $user && $user->rol === 'Administrador';
    }

    public function getDinosaurios(Request $request){
        $query = Dinosaurio::with(['especie', 'celda']); 
 
        // Filtro opcional por celda para usarlo desde el detalle de celda
        if ($request->has('celda_id')) {
            $query->where('celda_id', $request->celda_id);
        }

        $dinosaurios = $query->orderBy('nick')->get();
 
        return response()->json([
            'success' => true,
            'data' => $dinosaurios,
        ], 200);
    }

    public function getDinosaurio(int $id) {
        $dinosaurio = Dinosaurio::with(['especie', 'celda'])->find($id);
 
        if (!$dinosaurio) {
            return response()->json([
                'success' => false,
                'message' => 'Dinosaurio no encontrado',
            ], 404);
        }
 
        return response()->json([
            'success' => true,
            'data' => $dinosaurio,
        ], 200);
    }

    public function createDinosaurio(Request $request) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }
 
        $rules = [
            'nick' => 'required|string|max:50',
            'edad' => 'required|integer|min:0',
            'especie_id' => 'required|exists:especies,id',
            'celda_id' => 'nullable|exists:celdas,id',
        ];
 
        $messages = [
            'required' => 'El campo :attribute es obligatorio',
            'string' => 'El campo :attribute debe ser texto',
            'integer' => 'El campo :attribute debe ser un numero entero',
            'min' => 'El campo :attribute debe ser al menos :min',
            'max' => 'El campo :attribute no puede superar :max caracteres',
            'exists' => 'El :attribute seleccionado no existe',
        ];
 
        $attributes = [
            'nick' => 'nombre',
            'edad' => 'edad',
            'especie_id' => 'especie',
            'celda_id' => 'celda',
        ];
 
        $validator = Validator::make($request->all(), $rules, $messages, $attributes);
 
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors(),
            ], 422);
        }
 
        try {
            $dinosaurio = Dinosaurio::create([
                'nick' => $request->nick,
                'edad' => $request->edad,
                'especie_id' => $request->especie_id,
                'celda_id' => $request->celda_id ?? null,
            ]);
 
            $dinosaurio->load(['especie', 'celda']);
 
            return response()->json([
                'success' => true,
                'data' => $dinosaurio,
                'message' => 'Dinosaurio creado correctamente',
            ], 201);
 
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al crear el dinosaurio',
            ], 500);
        }
    }
    
    public function updateDinosaurio(Request $request, int $id) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }
 
        $dinosaurio = Dinosaurio::find($id);
 
        if (!$dinosaurio) {
            return response()->json([
                'success' => false,
                'message' => 'Dinosaurio no encontrado',
            ], 404);
        }
 
        $rules = [
            'nick' => 'required|string|max:50',
            'edad' => 'required|integer|min:0',
            'especie_id' => 'required|exists:especies,id',
            'celda_id' => 'nullable|exists:celdas,id',
        ];
 
        $messages = [
            'required' => 'El campo :attribute es obligatorio',
            'string' => 'El campo :attribute debe ser texto',
            'integer' => 'El campo :attribute debe ser un numero entero',
            'min' => 'El campo :attribute debe ser al menos :min',
            'max' => 'El campo :attribute no puede superar :max caracteres',
            'exists' => 'El :attribute seleccionado no existe',
        ];
 
        $attributes = [
            'nick' => 'nombre',
            'edad' => 'edad',
            'especie_id' => 'especie',
            'celda_id' => 'celda',
        ];
 
        $validator = Validator::make($request->all(), $rules, $messages, $attributes);
 
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors(),
            ], 422);
        }
 
        try {
            $dinosaurio->nick = $request->nick;
            $dinosaurio->edad = $request->edad;
            $dinosaurio->especie_id = $request->especie_id;
            // array_key_exists permite distinguir entre "no se mando celda_id"
            // y "se mando celda_id con valor null" (quitar de la celda)
            if (array_key_exists('celda_id', $request->all())) {
                $dinosaurio->celda_id = $request->celda_id;
            }
            $dinosaurio->save();
 
            $dinosaurio->load(['especie', 'celda']);
 
            return response()->json([
                'success' => true,
                'data' => $dinosaurio,
                'message' => 'Dinosaurio actualizado correctamente',
            ], 200);
 
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar el dinosaurio',
            ], 500);
        }
    }
    
    public function deleteDinosaurio(int $id) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }
 
        $dinosaurio = Dinosaurio::find($id);
 
        if (!$dinosaurio) {
            return response()->json([
                'success' => false,
                'message' => 'Dinosaurio no encontrado',
            ], 404);
        }
 
        try {
            $dinosaurio->delete();
 
            return response()->json([
                'success' => true,
                'message' => 'Dinosaurio eliminado correctamente',
            ], 200);
 
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al eliminar el dinosaurio',
            ], 500);
        }
    }
}
