<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $rules = [
            'nick' => 'required|string|max:30|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|min:6|confirmed',
            'foto' => 'nullable|image|mimes:jpeg,png,gif,webp,svg|max:2048',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'string' => 'El campo :attribute debe ser un texto valido.',
            'image' => 'El archivo del campo :attribute debe ser una imagen valida.',
            'mimes' => 'La imagen en :attribute debe ser jpeg, png, gif, webp o svg.',
            'max' => 'El campo :attribute no debe exceder el tamaño maximo permitido.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'email' => 'El campo :attribute debe ser un correo electronico valido.',
            'unique' => 'El :attribute ya esta en uso por otro usuario.',
            'confirmed' => 'La confirmacion de la contraseña no coincide.',
        ];

        $attributes = [
            'nick' => 'nombre de usuario',
            'email' => 'correo electronico',
            'password' => 'contraseña',
            'foto' => 'foto de perfil',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors()
            ], 422);
        }

        try {
            $input = $request->only(['nick', 'email', 'password']);
            $input['password'] = Hash::make($input['password']);
            $input['rol'] = 'Veterinario';

            if ($request->hasFile('foto') && $request->file('foto')->isValid()) {
                $file = $request->file('foto');
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $filename = uniqid('img_') . '_' . Str::slug($originalName) . '.' . $extension;
                $uploadedFilePath = Storage::disk('cloudinary')->putFileAs('jurassic', $file, $filename);
                $input['foto'] = Storage::disk('cloudinary')->url($uploadedFilePath);
            } else {
                $input['foto'] = 'https://res.cloudinary.com/dgznikiob/image/upload/v1772707938/fotoperfil_hmislm.png';
            }

            $user = User::create($input);
            $token = JWTAuth::fromUser($user);

            $success = [
                'id' => $user->id,
                'nick' => $user->nick,
                'email' => $user->email,
                'rol' => $user->rol,
                'token' => $token,
                'foto' => $user->foto,
            ];

            return response()->json([
                'success' => true,
                'data' => $success,
                'message' => 'Usuario registrado correctamente',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error en el registro: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $rules = [
            'email' => 'required|email',
            'password' => 'required',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio',
            'email' => 'El campo :attribute debe ser un correo electronico valido',
        ];

        $attributes = [
            'email' => 'correo electronico',
            'password' => 'contraseña',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors()
            ], 422);
        }

        try {
            if (! $token = JWTAuth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales incorrectas',
                ], 401);
            }

            $user = User::where('email', $request->email)->firstOrFail();

            $success = [
                'id' => $user->id,
                'nick' => $user->nick,
                'email' => $user->email,
                'rol' => $user->rol,
                'token' => $token,
                'foto' => $user->foto ?? null,
            ];

            return response()->json([
                'success' => true,
                'data' => $success,
                'message' => 'Login exitoso',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error en el login: ' . $e->getMessage()
            ], 500);
        }
    }

    public function actualizarPerfil(Request $request)
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 401);
        }

        $rules = [
            // El nick debe ser único, excepto para el ID del usuario actual para que pueda guardar sin cambiar su nick
            'nick' => 'required|string|max:30|unique:users,nick,' . $user->id,
            'foto' => 'nullable|image|mimes:jpeg,png,gif,webp,svg|max:2048',
            'password' => 'nullable|min:6|confirmed',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'string' => 'El campo :attribute debe ser un texto valido.',
            'image' => 'El archivo del campo :attribute debe ser una imagen valida.',
            'mimes' => 'La imagen en :attribute debe ser jpeg, png, gif, webp o svg.',
            'max' => 'El campo :attribute no debe exceder el tamaño maximo permitido.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'unique' => 'El :attribute ya esta en uso por otro usuario.',
            'confirmed' => 'La confirmacion de la contraseña no coincide.',
        ];

        $attributes = [
            'nick' => 'nombre de usuario',
            'password' => 'contraseña',
            'foto' => 'foto de perfil',
        ];

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errores' => $validator->errors()
            ], 422);
        }

        try {
            $user->nick = $request->nick;

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            if ($request->hasFile('foto') && $request->file('foto')->isValid()) {
                $file = $request->file('foto');
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $filename = uniqid('img_') . '_' . Str::slug($originalName) . '.' . $extension;

                $uploadedFilePath = Storage::disk('cloudinary')->putFileAs('jurassic', $file, $filename);
                $user->foto = Storage::disk('cloudinary')->url($uploadedFilePath);
            }

            $user->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'nick' => $user->nick,
                    'email' => $user->email,
                    'rol' => $user->rol,
                    'foto' => $user->foto,
                ],
                'message' => 'Perfil actualizado correctamente.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar el perfil: ' . $e->getMessage()
            ], 500);
        }
    }
}
