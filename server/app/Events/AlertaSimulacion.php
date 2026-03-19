<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlertaSimulacion implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $tipo;
    public string $mensaje;
    public array  $datos;

    public function __construct(string $tipo, string $mensaje, array $datos = [])
    {
        $this->tipo    = $tipo;
        $this->mensaje = $mensaje;
        $this->datos   = $datos;
    }

    /**
     * Canal publico 'simulaciones' — todos los usuarios conectados lo reciben
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('simulaciones'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'simulacion.lanzada';
    }

    public function broadcastWith(): array
    {
        return [
            'tipo'    => $this->tipo,
            'mensaje' => $this->mensaje,
            'datos'   => $this->datos,
        ];
    }
}