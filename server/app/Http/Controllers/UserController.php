<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    private function isAdmin() {
        $user = auth('api')->user();
        return $user && $user->rol === 'Administrador';
    }

    public function getUsuarios() {
        if(!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado'
            ], 403);
        }

        $usuarios = User::select('id', 'nick', 'email', 'rol', 'foto', 'created_at')->get();

        return response()->json([
            'success' => true,
            'data' => $usuarios
        ], 200);
    }

    public function getUsuario($id) {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso demegado'
            ], 403);
        }

        $usuario = User::select('id', 'nick', 'email', 'rol', 'foto', 'created_at')->find($id);

        if(!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $usuario
        ], 200);
    }

    public function updateRole(Request $request, $id){
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rol' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors()
            ], 422);
        }

        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        if ($usuario->id === auth('api')->user()->id) {
            return response()->json(['success' => false, 'message' => 'No puedes modificar tus propios permisos de admin'], 400);
        }

        $usuario->rol = $request->rol;
        $usuario->save();

        return response()->json([
            'success' => true,
            'message' => 'Rol del usuario actualizado correctamente',
            'data' => $usuario
        ], 200);
    }

    public function deleteUser($id) {
        if(!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado'
            ], 403);
        }

        $usuario = User::find($id);

        if(!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        if ($usuario->id === auth('api')->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propia cuenta'
            ], 400);
        }

        $usuario->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado'
        ], 200);
    }
}
