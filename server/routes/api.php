<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CeldaController;
use App\Http\Controllers\DinosaurioController;
use App\Http\Controllers\EspecieController;
use App\Http\Controllers\SimulacionController;
use App\Http\Controllers\TareaController;

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

    Route::prefix('tareas')->group(function () {
        Route::get('/', [TareaController::class, 'getTareas']);
        Route::get('/{id}', [TareaController::class, 'getTarea']);
        Route::post('/', [TareaController::class, 'createTarea']);
        Route::post('/{id}', [TareaController::class, 'updateTarea']);
        Route::patch('/{id}/estado', [TareaController::class, 'updateEstado']);
        Route::delete('/{id}', [TareaController::class, 'deleteTarea']);
    });

    Route::prefix('simulaciones')->group(function () {
        Route::post('/normal', [SimulacionController::class, 'simularNormal']);
        Route::get('/informes', [SimulacionController::class, 'getInformes']);
    });
});