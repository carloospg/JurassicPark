<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tarea;
use Illuminate\Support\Facades\Validator;

class TareaController extends Controller
{
    /**
     * Comprueba si el usuario autenticado es Administrador.
     */
    private function isAdmin()
    {
        $user = auth('api')->user();
        return $user && $user->rol === 'Administrador';
    }

    public function getTareas()
    {
        $user = auth('api')->user();

        if ($this->isAdmin()) {
            $tareas = Tarea::with(['celda', 'usuarios'])
                ->orderBy('estado')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $tareas = $user->tareas()
                ->with(['celda', 'usuarios'])
                ->orderBy('estado')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data'    => $tareas,
        ], 200);
    }

    public function getTarea(int $id)
    {
        $user  = auth('api')->user();
        $tarea = Tarea::with(['celda', 'usuarios'])->find($id);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada',
            ], 404);
        }

        if (!$this->isAdmin()) {
            $esAsignado = $tarea->usuarios->contains('id', $user->id);
            if (!$esAsignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a esta tarea',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $tarea,
        ], 200);
    }

    public function createTarea(Request $request)
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        $rules = [
            'tipo'         => 'required|string|max:100',
            'celda_id'     => 'required|exists:celdas,id',
            'usuarios_ids' => 'nullable|array',
            'usuarios_ids.*' => 'exists:users,id',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio',
            'exists'   => 'El :attribute seleccionado no existe',
            'array'    => 'El campo :attribute debe ser una lista',
        ];

        $attributes = [
            'tipo'         => 'tipo de tarea',
            'celda_id'     => 'celda',
            'usuarios_ids' => 'usuarios asignados',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors(),
            ], 422);
        }

        try {
            $tarea = Tarea::create([
                'tipo'     => $request->tipo,
                'estado'   => 'Pendiente',
                'celda_id' => $request->celda_id,
            ]);

            if ($request->has('usuarios_ids') && !empty($request->usuarios_ids)) {
                $tarea->usuarios()->sync($request->usuarios_ids);
            }

            $tarea->load(['celda', 'usuarios']);

            return response()->json([
                'success' => true,
                'data'    => $tarea,
                'message' => 'Tarea creada correctamente',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Error al crear la tarea: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateEstado(Request $request, int $id)
    {
        $user  = auth('api')->user();
        $tarea = Tarea::with('usuarios')->find($id);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada',
            ], 404);
        }

        if (!$this->isAdmin()) {
            $esAsignado = $tarea->usuarios->contains('id', $user->id);
            if (!$esAsignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a esta tarea',
                ], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:Pendiente,En progreso,Finalizada',
        ], [
            'required' => 'El campo estado es obligatorio',
            'in'       => 'El estado debe ser Pendiente, En progreso o Finalizada',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors(),
            ], 422);
        }

        $flujo = ['Pendiente' => 0, 'En progreso' => 1, 'Finalizada' => 2];
        $estadoActual = $flujo[$tarea->estado];
        $estadoNuevo  = $flujo[$request->estado];

        if ($estadoNuevo !== $estadoActual + 1) {
            return response()->json([
                'success' => false,
                'message' => 'El cambio de estado no es valido. El flujo es: Pendiente -> En progreso -> Finalizada',
            ], 422);
        }

        try {
            $tarea->estado = $request->estado;
            $tarea->save();

            return response()->json([
                'success' => true,
                'data'    => $tarea,
                'message' => 'Estado actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Error al actualizar el estado: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function deleteTarea($id)
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        $tarea = Tarea::find($id);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada',
            ], 404);
        }

        try {
            $tarea->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tarea eliminada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Error al eliminar la tarea: ' . $e->getMessage(),
            ], 500);
        }
    }
}