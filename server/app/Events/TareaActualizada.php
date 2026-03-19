<?php

namespace App\Events;

use App\Models\Tarea;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TareaActualizada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $tarea;
    public string $accion;

    public function __construct(Tarea $tarea, string $accion = 'actualizada')
    {
        $this->tarea  = $tarea;
        $this->accion = $accion;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('tareas'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'tarea.actualizada';
    }

    public function broadcastWith(): array
    {
        $mensajes = [
            'creada'       => "Se te ha asignado una nueva tarea: \"{$this->tarea->tipo}\"",
            'actualizada'  => "La tarea \"{$this->tarea->tipo}\" ha sido modificada",
            'estado'       => "La tarea \"{$this->tarea->tipo}\" ha cambiado a \"{$this->tarea->estado}\"",
        ];

        return [
            'tarea' => [
                'id'       => $this->tarea->id,
                'tipo'     => $this->tarea->tipo,
                'estado'   => $this->tarea->estado,
                'celda_id' => $this->tarea->celda_id,
            ],
            'accion'  => $this->accion,
            'mensaje' => $mensajes[$this->accion] ?? $mensajes['actualizada'],
        ];
    }
}