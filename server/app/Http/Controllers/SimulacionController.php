<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Celda;
use App\Models\Tarea;
use App\Models\User;
use App\Models\InformeSimulacion;

class SimulacionController extends Controller
{
    private function isAdmin()
    {
        $user = auth('api')->user();
        return $user && $user->rol === 'Administrador';
    }

    public function simularNormal()
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        $celdas = Celda::all();
        $tareasCreadas = [];
        $celdasAfectadas = [];

        foreach ($celdas as $celda) {
            $resumenCelda = [
                'celda_id' => $celda->id,
                'posicion' => "Fila {$celda->fila}, Columna {$celda->columna}",
                'alimento_antes' => $celda->alimento_porcentaje,
                'averias_antes' => $celda->averias_pendientes,
                'cambios' => [],
            ];

            // Bajo el alimento entre un 10% y un 30%
            $bajada = rand(10, 30);
            $nuevoAlimento = max(0, $celda->alimento_porcentaje - $bajada);
            $celda->alimento_porcentaje = $nuevoAlimento;
            $resumenCelda['cambios'][] = "Alimento bajo de {$resumenCelda['alimento_antes']}% a {$nuevoAlimento}%";

            // Genero averias aleatorias (30% de probabilidad)
            $nuevaAveria = false;
            if (rand(1, 100) <= 30) {
                $celda->averias_pendientes += 1;
                $nuevaAveria = true;
                $resumenCelda['cambios'][] = "Nueva averia generada";
            }

            $celda->save();

            if ($nuevoAlimento < 30) {
                $tarea = Tarea::create([
                    'tipo' => 'Alimentacion urgente',
                    'estado' => 'Pendiente',
                    'celda_id' => $celda->id,
                ]);
                $tareasCreadas[] = $tarea->id;
                $resumenCelda['cambios'][] = "Tarea de alimentacion creada (alimento critico)";
            }

            if ($nuevaAveria) {
                $tarea = Tarea::create([
                    'tipo' => 'Reparacion de averia',
                    'estado' => 'Pendiente',
                    'celda_id' => $celda->id,
                ]);
                $tareasCreadas[] = $tarea->id;
                $resumenCelda['cambios'][] = "Tarea de reparacion creada";
            }

            $resumenCelda['alimento_despues'] = $nuevoAlimento;
            $resumenCelda['averias_despues']  = $celda->averias_pendientes;
            $celdasAfectadas[] = $resumenCelda;
        }

        $informe = InformeSimulacion::create([
            'tipo' => 'Normal',
            'detalles' => [
                'total_celdas' => count($celdas),
                'tareas_creadas' => count($tareasCreadas),
                'ids_tareas_creadas' => $tareasCreadas,
                'celdas' => $celdasAfectadas,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Simulacion normal completada',
            'data' => [
                'informe_id' => $informe->id,
                'total_celdas' => count($celdas),
                'tareas_creadas' => count($tareasCreadas),
                'celdas' => $celdasAfectadas,
            ],
        ], 200);
    }

    public function simularBrecha(Request $request)
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        // Selecciono la celda, la indicada o una aleatoria
        if ($request->has('celda_id')) {
            $celda = Celda::with(['dinosaurios.especie'])->find($request->celda_id);
            if (!$celda) {
                return response()->json([
                    'success' => false,
                    'message' => 'Celda no encontrada',
                ], 404);
            }
        } else {
            $celda = Celda::with(['dinosaurios.especie'])->inRandomOrder()->first();
            if (!$celda) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay celdas disponibles para la simulacion',
                ], 422);
            }
        }

        $puntuacion = 0;
        $factores   = [];

        // Nivel de seguridad
        $puntosSeguiridad = ['Bajo' => 40, 'Medio' => 25, 'Alto' => 10, 'Extremo' => 0];
        $ptsSeguridad = $puntosSeguiridad[$celda->nivel_seguridad] ?? 0;
        $puntuacion += $ptsSeguridad;
        if ($ptsSeguridad > 0) {
            $factores[] = "Nivel de seguridad {$celda->nivel_seguridad}: +{$ptsSeguridad} puntos";
        }

        // Dinosaurios peligrosos
        $puntosXPeligrosidad = ['Muy Alto' => 5, 'Extremo' => 8, 'Critico' => 15];
        $ptsDinos = 0;
        foreach ($celda->dinosaurios as $dino) {
            $peligrosidad = $dino->especie->peligrosidad ?? '';
            if (isset($puntosXPeligrosidad[$peligrosidad])) {
                $ptsDinos += $puntosXPeligrosidad[$peligrosidad];
            }
        }
        $puntuacion += $ptsDinos;
        if ($ptsDinos > 0) {
            $factores[] = "Dinosaurios peligrosos en la celda: +{$ptsDinos} puntos";
        }

        // Averias pendientes
        $ptsAverias = min($celda->averias_pendientes * 5, 20);
        $puntuacion += $ptsAverias;
        if ($ptsAverias > 0) {
            $factores[] = "{$celda->averias_pendientes} averias pendientes: +{$ptsAverias} puntos";
        }

        // Falta de alimento
        if ($celda->alimento_porcentaje < 20) {
            $puntuacion += 10;
            $factores[] = "Alimento critico ({$celda->alimento_porcentaje}%): +10 puntos";
        }

        $brecha_contenida = $puntuacion < 60;
        $resultado = $brecha_contenida ? 'Contenida' : 'Fuga';

        // Si hay fuga generamos una tarea de emergencia
        $tareaEmergencia = null;
        if (!$brecha_contenida) {
            $tareaEmergencia = Tarea::create([
                'tipo' => 'Emergencia: brecha de seguridad',
                'estado' => 'Pendiente',
                'celda_id' => $celda->id,
            ]);

            $celda->averias_pendientes += 2;
            $celda->save();
        }

        $informe = InformeSimulacion::create([
            'tipo' => 'Brecha',
            'detalles' => [
                'celda_id' => $celda->id,
                'posicion' => "Fila {$celda->fila}, Columna {$celda->columna}",
                'puntuacion' => $puntuacion,
                'factores' => $factores,
                'resultado' => $resultado,
                'brecha_contenida' => $brecha_contenida,
                'tarea_emergencia' => $tareaEmergencia?->id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => $brecha_contenida
                ? 'La brecha ha sido contenida con exito'
                : 'ALERTA: La brecha no ha podido contenerse. Se han generado tareas de emergencia',
            'data'    => [
                'informe_id' => $informe->id,
                'celda_id' => $celda->id,
                'posicion' => "Fila {$celda->fila}, Columna {$celda->columna}",
                'puntuacion' => $puntuacion,
                'factores' => $factores,
                'resultado' => $resultado,
                'brecha_contenida' => $brecha_contenida,
                'tarea_emergencia' => $tareaEmergencia?->id,
            ],
        ], 200);
    }

    public function getInformes()
    {
        if (!$this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado',
            ], 403);
        }

        $informes = InformeSimulacion::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $informes,
        ], 200);
    }
}