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

        $celdas          = Celda::all();
        $tareasCreadas   = [];
        $celdasAfectadas = [];

        foreach ($celdas as $celda) {
            $resumenCelda = [
                'celda_id'          => $celda->id,
                'posicion'          => "Fila {$celda->fila}, Columna {$celda->columna}",
                'alimento_antes'    => $celda->alimento_porcentaje,
                'averias_antes'     => $celda->averias_pendientes,
                'cambios'           => [],
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
                    'tipo'     => 'Alimentacion urgente',
                    'estado'   => 'Pendiente',
                    'celda_id' => $celda->id,
                ]);
                $tareasCreadas[] = $tarea->id;
                $resumenCelda['cambios'][] = "Tarea de alimentacion creada (alimento critico)";
            }

            if ($nuevaAveria) {
                $tarea = Tarea::create([
                    'tipo'     => 'Reparacion de averia',
                    'estado'   => 'Pendiente',
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
            'tipo'     => 'Normal',
            'detalles' => [
                'total_celdas'         => count($celdas),
                'tareas_creadas'       => count($tareasCreadas),
                'ids_tareas_creadas'   => $tareasCreadas,
                'celdas'               => $celdasAfectadas,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Simulacion normal completada',
            'data'    => [
                'informe_id'     => $informe->id,
                'total_celdas'   => count($celdas),
                'tareas_creadas' => count($tareasCreadas),
                'celdas'         => $celdasAfectadas,
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
            'data'    => $informes,
        ], 200);
    }
}