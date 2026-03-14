import CONSTANTS from '../constants';
import { initNavbar } from '../navbar';

declare const bootstrap: any;

const token      = sessionStorage.getItem('token_jurassic');
const userString = sessionStorage.getItem('user_jurassic');

if (!token || !userString) {
    window.location.href = '/';
}

const usuarioActual = JSON.parse(userString!);

initNavbar('dinosaurios');

// ─── BOTON CREAR (solo admin) ─────────────────────────────────────────────────
if (usuarioActual.rol !== 'Administrador') {
    document.getElementById('btn-nuevo-dino')?.remove();
}

// ─── COLORES DE PELIGROSIDAD ──────────────────────────────────────────────────
const badgePeligrosidad: Record<string, string> = {
    'Bajo':     'bg-success',
    'Medio':    'bg-primary',
    'Alto':     'bg-warning text-white',
    'Muy Alto': 'bg-danger',
    'Extremo':  'bg-danger',
    'Critico':  'bg-danger',
};

const badgeDieta: Record<string, string> = {
    'Herbivoros': 'bg-success',
    'Omnivoros':  'bg-warning text-dark',
    'Carnivoros': 'bg-danger',
};

// ─── ESTADO LOCAL ─────────────────────────────────────────────────────────────
let todosLosDinos: any[] = [];

// ─── CARGAR Y RENDERIZAR DINOSAURIOS ─────────────────────────────────────────
const gridDinosaurios = document.getElementById('grid-dinosaurios') as HTMLDivElement;

const renderDinos = (dinos: any[]) => {
    if (dinos.length === 0) {
        gridDinosaurios.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No se encontraron dinosaurios</h5>
            </div>
        `;
        return;
    }

    gridDinosaurios.innerHTML = dinos.map(d => {
        const badgePel  = badgePeligrosidad[d.especie?.peligrosidad] || 'bg-secondary';
        const badgeDiet = badgeDieta[d.especie?.dieta] || 'bg-secondary';
        const celda     = d.celda ? `Celda ${d.celda.fila},${d.celda.columna}` : 'Sin celda';

        const botonesAdmin = usuarioActual.rol === 'Administrador' ? `
            <div class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-primary btn-sm flex-fill btn-editar-dino"
                    data-id="${d.id}"
                    data-nick="${d.nick}"
                    data-edad="${d.edad}"
                    data-especie="${d.especie_id}"
                    data-celda="${d.celda_id ?? ''}">
                    <i class="bi bi-pencil me-1"></i>Editar
                </button>
                <button class="btn btn-outline-danger btn-sm flex-fill btn-eliminar-dino" data-id="${d.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        ` : '';

        return `
            <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                <div class="card dino-card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
                        <span class="fw-bold">${d.nick}</span>
                        <span class="badge ${badgePel} badge-peligrosidad">${d.especie?.peligrosidad ?? ''}</span>
                    </div>
                    <div class="card-body pb-2">
                        <p class="mb-1"><i class="bi bi-bug me-2 text-muted"></i><strong>${d.especie?.nombre ?? 'Desconocida'}</strong></p>
                        <p class="mb-1"><span class="badge ${badgeDiet} me-1">${d.especie?.dieta ?? ''}</span></p>
                        <p class="mb-1 text-muted small"><i class="bi bi-calendar3 me-1"></i>${d.edad} años</p>
                        <p class="mb-0 text-muted small"><i class="bi bi-geo-alt me-1"></i>${celda}</p>
                        ${botonesAdmin}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Eventos editar y eliminar
    gridDinosaurios.querySelectorAll('.btn-editar-dino').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = btn as HTMLButtonElement;
            abrirModalEditar(
                parseInt(b.dataset.id!),
                b.dataset.nick!,
                parseInt(b.dataset.edad!),
                parseInt(b.dataset.especie!),
                b.dataset.celda ? parseInt(b.dataset.celda) : null
            );
        });
    });

    gridDinosaurios.querySelectorAll('.btn-eliminar-dino').forEach(btn => {
        btn.addEventListener('click', () => {
            dinoIdAEliminar = parseInt((btn as HTMLButtonElement).dataset.id!);
            modalConfirmarBorrado.show();
        });
    });
};

const cargarDinosaurios = async () => {
    gridDinosaurios.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-warning" role="status"></div>
            <p class="text-secondary mt-2">Cargando dinosaurios...</p>
        </div>
    `;

    try {
        const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.DINOSAURIOS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cargar los dinosaurios');

        todosLosDinos = data.data;
        renderDinos(todosLosDinos);

    } catch (error: any) {
        gridDinosaurios.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
    }
};

// ─── FILTROS ──────────────────────────────────────────────────────────────────
const aplicarFiltros = () => {
    const nombre      = (document.getElementById('filtro-nombre') as HTMLInputElement).value.toLowerCase();
    const dieta       = (document.getElementById('filtro-dieta') as HTMLSelectElement).value;
    const peligrosidad = (document.getElementById('filtro-peligrosidad') as HTMLSelectElement).value;

    const filtrados = todosLosDinos.filter(d => {
        const coincideNombre      = d.nick.toLowerCase().includes(nombre);
        const coincideDieta       = dieta === '' || d.especie?.dieta === dieta;
        const coincidePeligrosidad = peligrosidad === '' || d.especie?.peligrosidad === peligrosidad;
        return coincideNombre && coincideDieta && coincidePeligrosidad;
    });

    renderDinos(filtrados);
};

document.getElementById('filtro-nombre')?.addEventListener('input', aplicarFiltros);
document.getElementById('filtro-dieta')?.addEventListener('change', aplicarFiltros);
document.getElementById('filtro-peligrosidad')?.addEventListener('change', aplicarFiltros);

// ─── MODAL CREAR / EDITAR ─────────────────────────────────────────────────────
const modalDinoEl    = document.getElementById('modalDino')!;
const modalDino      = new bootstrap.Modal(modalDinoEl);
const modalTitulo    = document.getElementById('modal-dino-titulo')!;
const inputDinoId    = document.getElementById('dino-id') as HTMLInputElement;
const inputNick      = document.getElementById('dino-nick') as HTMLInputElement;
const inputEdad      = document.getElementById('dino-edad') as HTMLInputElement;
const selectEspecie  = document.getElementById('dino-especie') as HTMLSelectElement;
const selectCelda    = document.getElementById('dino-celda') as HTMLSelectElement;
const alertModalDino = document.getElementById('alert-modal-dino') as HTMLDivElement;

// Cargamos especies y celdas en los selectores del modal
const cargarSelectores = async () => {
    try {
        const [resEspecies, resCeldas] = await Promise.all([
            fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.ESPECIES, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            }),
            fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.CELDAS, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            }),
        ]);

        const dataEspecies = await resEspecies.json();
        const dataCeldas   = await resCeldas.json();

        selectEspecie.innerHTML = dataEspecies.data.map((e: any) =>
            `<option value="${e.id}">${e.nombre} (${e.dieta} - ${e.peligrosidad})</option>`
        ).join('');

        selectCelda.innerHTML = '<option value="">Sin celda asignada</option>' +
            dataCeldas.data.map((c: any) =>
                `<option value="${c.id}">Celda ${c.fila},${c.columna} - ${c.nivel_seguridad}</option>`
            ).join('');

    } catch (error) {
        console.error('Error al cargar selectores', error);
    }
};

const abrirModalCrear = async () => {
    modalTitulo.innerText = 'Nuevo Dinosaurio';
    inputDinoId.value     = '';
    inputNick.value       = '';
    inputEdad.value       = '0';
    alertModalDino.classList.add('d-none');
    await cargarSelectores();
    modalDino.show();
};

const abrirModalEditar = async (id: number, nick: string, edad: number, especieId: number, celdaId: number | null) => {
    modalTitulo.innerText = 'Editar Dinosaurio';
    inputDinoId.value     = String(id);
    inputNick.value       = nick;
    inputEdad.value       = String(edad);
    alertModalDino.classList.add('d-none');
    await cargarSelectores();
    selectEspecie.value = String(especieId);
    selectCelda.value   = celdaId ? String(celdaId) : '';
    modalDino.show();
};

document.getElementById('btn-nuevo-dino')?.addEventListener('click', abrirModalCrear);

// ─── GUARDAR DINOSAURIO ───────────────────────────────────────────────────────
document.getElementById('btn-guardar-dino')?.addEventListener('click', async () => {
    const id        = inputDinoId.value;
    const esEdicion = id !== '';

    const body: any = {
        nick:       inputNick.value,
        edad:       parseInt(inputEdad.value),
        especie_id: parseInt(selectEspecie.value),
        celda_id:   selectCelda.value !== '' ? parseInt(selectCelda.value) : null,
    };

    const url = esEdicion
        ? `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.DINOSAURIOS}/${id}`
        : `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.DINOSAURIOS}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            let msg = data.message || 'Error al guardar';
            if (data.errores) msg = Object.values(data.errores).flat().join('<br>');
            alertModalDino.className = 'alert alert-danger';
            alertModalDino.innerHTML = msg;
            return;
        }

        modalDino.hide();
        cargarDinosaurios();

    } catch (error) {
        alertModalDino.className = 'alert alert-danger';
        alertModalDino.innerHTML = 'Error de conexion';
    }
});

// ─── ELIMINAR DINOSAURIO ──────────────────────────────────────────────────────
let dinoIdAEliminar: number | null = null;

const modalConfirmarBorradoEl = document.getElementById('modalConfirmarBorradoDino')!;
const modalConfirmarBorrado   = new bootstrap.Modal(modalConfirmarBorradoEl);

document.getElementById('btn-confirmar-borrado-dino')?.addEventListener('click', async () => {
    if (dinoIdAEliminar === null) return;

    try {
        const res = await fetch(`${CONSTANTS.API.BASE_URL}${CONSTANTS.API.DINOSAURIOS}/${dinoIdAEliminar}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        const data = await res.json();
        modalConfirmarBorrado.hide();
        dinoIdAEliminar = null;

        if (res.ok) {
            cargarDinosaurios();
        } else {
            alert(data.message || 'Error al eliminar el dinosaurio');
        }
    } catch (error) {
        alert('Error de conexion');
    }
});

cargarDinosaurios();