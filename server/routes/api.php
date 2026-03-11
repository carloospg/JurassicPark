<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CeldaController;

Route::post('/registro', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('/perfil/actualizar', [AuthController::class, 'actualizarPerfil']);

    Route::middleware('rol:Administrador')->prefix('usuarios')->group(function () {
        Route::get('/', [UserController::class, 'getUsuarios']);
        Route::get('/{id}', [UserController::class, 'getUsuario']);
        Route::put('/{id}/rol', [UserController::class, 'updateRole']);
        Route::delete('/{id}', [UserController::class, 'deleteUser']);
    });

    Route::prefix('celdas')->group(function () {
        Route::get('/', [CeldaController::class, 'getCeldas']);
        Route::get('/{id}', [CeldaController::class, 'getCelda']);
        Route::post('/', [CeldaController::class, 'createCelda']);
        Route::post('/{id}', [CeldaController::class, 'updateCelda']);
        Route::delete('/{id}', [CeldaController::class, 'deleteCelda']);
    });
});