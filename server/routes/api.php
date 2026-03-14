<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CeldaController;
use App\Http\Controllers\DinosaurioController;
use App\Http\Controllers\EspecieController;

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

    Route::get('/especies', [EspecieController::class, 'getEspecies']);

    Route::prefix('dinosaurios')->group(function() {
        Route::get('/', [DinosaurioController::class, 'getDinosaurios']);
        Route::get('/{id}', [DinosaurioController::class, 'getDinosaurio']);
        Route::post('/', [DinosaurioController::class, 'createDinosaurio']);
        Route::post('/{id}', [DinosaurioController::class, 'updateDinosaurio']);
        Route::delete('/{id}', [DinosaurioController::class, 'deleteDinosaurio']);
    });
});