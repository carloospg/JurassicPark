<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Celda;
use Illuminate\Support\Facades\Validator;

class CeldaController extends Controller
{
    private function isAdmin() {
        $user = auth('api')->user();
        return $user && $user->rol === 'Administrador';
    }

    public function getCeldas() {
        $celdas = Celda::with('dinosaurios')
            ->orderBy('fila')
            ->orderBy('columna')
            ->get()
        ;

        return response()->json([
            'success' => true,
            'data' => $celdas,
        ], 200);
    }

    public function getCelda($id) {
        $celda = Celda::with(['dinosaurios.especie'])->find($id);

        if (!$celda) {
            return response()->json([
                'success' => false,
                'message' => 'Celda no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $celda,
        ], 200);
    }

    public function createCelda(Request $request) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        $rules = [
            'fila' => 'required|integer|min:1',
            'columna' => 'required|integer|min:1',
            'nivel_seguridad' => 'required|in:Bajo,Medio,Alto,Extremo',
            'alimento_porcentaje' => 'nullable|integer|min:0|max:100',
            'averias_pendientes' => 'nullable|integer|min:0',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'integer'  => 'El campo :attribute debe ser un número entero.',
            'min'      => 'El campo :attribute debe ser al menos :min.',
            'max'      => 'El campo :attribute no puede superar :max.',
            'in'       => 'El nivel de seguridad debe ser Bajo, Medio, Alto o Extremo.',
        ];

        $attributes = [
            'fila'                => 'fila',
            'columna'             => 'columna',
            'nivel_seguridad'     => 'nivel de seguridad',
            'alimento_porcentaje' => 'porcentaje de alimento',
            'averias_pendientes'  => 'averías pendientes',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errores' => $validator->errors(),
            ], 422);
        }

        $existe = Celda::where('fila', $request->fila)
                        ->where('columna', $request->columna)
                        ->exists();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe una celda en esa posicion',
            ], 422);
        }

        try {

            $celda = Celda::create([
                'fila' => $request->fila,
                'columna' => $request->columna,
                'nivel_seguridad' => $request->nivel_seguridad,
                'alimento_porcentaje' => $request->alimento_porcentaje ?? 100,
                'averias_pendientes' => $request->averias_pendientes ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'data' => $celda,
                'message' => 'Celda creada correctamente'
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error'   => 'Error al crear la celda: ' . $e->getMessage(),
            ], 500);

        }
    }

    public function updateCelda(Request $request, $id) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso delegado'
            ], 403);
        }

        $celda = Celda::find($id);

        if (!$celda) {
            return response()->json([
                'success' => false,
                'message' => 'Celda no encontrada.',
            ], 404);
        }

        $rules = [
            'fila'                => 'required|integer|min:1',
            'columna'             => 'required|integer|min:1',
            'nivel_seguridad'     => 'required|in:Bajo,Medio,Alto,Extremo',
            'alimento_porcentaje' => 'nullable|integer|min:0|max:100',
            'averias_pendientes'  => 'nullable|integer|min:0',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'integer'  => 'El campo :attribute debe ser un número entero.',
            'min'      => 'El campo :attribute debe ser al menos :min.',
            'max'      => 'El campo :attribute no puede superar :max.',
            'in'       => 'El nivel de seguridad debe ser Bajo, Medio, Alto o Extremo.',
        ];

        $attributes = [
            'fila'                => 'fila',
            'columna'             => 'columna',
            'nivel_seguridad'     => 'nivel de seguridad',
            'alimento_porcentaje' => 'porcentaje de alimento',
            'averias_pendientes'  => 'averias pendientes',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors(),
            ], 422);
        }

        $existe = Celda::where('fila', $request->fila)
                       ->where('columna', $request->columna)
                       ->where('id', '!=', $id)
                       ->exists();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe otra celda en la posición',
            ], 422);
        }

        try {
            $celda->fila = $request->fila;
            $celda->columna = $request->columna;
            $celda->nivel_seguridad = $request->nivel_seguridad;
            $celda->alimento_porcentaje = $request->alimento_porcentaje ?? $celda->alimento_porcentaje;
            $celda->averias_pendientes  = $request->averias_pendientes ?? $celda->averias_pendientes;
            $celda->save();

            return response()->json([
                'success' => true,
                'data'    => $celda,
                'message' => 'Celda actualizada correctamente.',
            ], 200);    

        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'error'   => 'Error al actualizar la celda: ' . $e->getMessage(),
            ], 500);

        }
    }

    public function deleteCelda(int $id)
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado.',
            ], 403);
        }

        $celda = Celda::find($id);

        if (!$celda) {
            return response()->json([
                'success' => false,
                'message' => 'Celda no encontrada.',
            ], 404);
        }

        try {
            $celda->delete();

            return response()->json([
                'success' => true,
                'message' => 'Celda eliminada correctamente.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Error al eliminar la celda: ' . $e->getMessage(),
            ], 500);
        }
    }
}
