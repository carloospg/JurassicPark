import echo from './echo';

const mostrarToast = (titulo: string, mensaje: string, tipo: 'success' | 'danger' | 'warning' | 'info') => {
    const colores: Record<string, string> = {
        success: 'bg-success',
        danger:  'bg-danger',
        warning: 'bg-warning text-dark',
        info:    'bg-primary',
    };

    const iconos: Record<string, string> = {
        success: 'bi-check-circle-fill',
        danger:  'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info:    'bi-info-circle-fill',
    };

    let contenedor = document.getElementById('toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toast-container';
        contenedor.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(contenedor);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast show text-white ${colores[tipo]} border-0 shadow`;
    toastEl.style.cssText = 'min-width:300px;max-width:400px;';
    toastEl.innerHTML = `
        <div class="toast-header ${colores[tipo]} text-white border-0">
            <i class="bi ${iconos[tipo]} me-2"></i>
            <strong class="me-auto">${titulo}</strong>
            <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast').remove()"></button>
        </div>
        <div class="toast-body">${mensaje}</div>
    `;

    contenedor.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 5000);
};

// Flags para evitar registrar el mismo listener mas de una vez
let escuchandoTareas      = false;
let escuchandoSimulaciones = false;

export const escucharTareas = (onActualizada: () => void) => {
    if (escuchandoTareas) return;
    escuchandoTareas = true;

    echo.channel('tareas')
        .listen('.tarea.actualizada', (e: any) => {
            mostrarToast('Tarea', e.mensaje, 'info');
            onActualizada();
        });
};

export const escucharSimulaciones = (onSimulacion: () => void) => {
    if (escuchandoSimulaciones) return;
    escuchandoSimulaciones = true;

    echo.channel('simulaciones')
        .listen('.simulacion.lanzada', (e: any) => {
            const esBrecha  = e.tipo === 'Brecha';
            const contenida = e.datos?.brecha_contenida;
            const tipo      = esBrecha ? (contenida ? 'warning' : 'danger') : 'info';

            mostrarToast(
                esBrecha ? 'Simulacion de Brecha' : 'Simulacion Normal',
                e.mensaje,
                tipo
            );

            onSimulacion();
        });
};

export const desconectar = () => {
    echo.leaveChannel('tareas');
    echo.leaveChannel('simulaciones');
    escuchandoTareas       = false;
    escuchandoSimulaciones = false;
};