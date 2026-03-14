import CONSTANTS from "../constants";
import { initNavbar } from "../navbar";

declare const bootstrap: any;

// ─── GUARDIA DE RUTA Y NAVBAR ─────────────────────────────────────────────────
const token = sessionStorage.getItem("token_jurassic");
const userString = sessionStorage.getItem("user_jurassic");

if (!token || !userString) {
  window.location.href = "/";
}

const usuarioActual = JSON.parse(userString!);

// Montamos el navbar indicando que la pagina activa es 'panel'
initNavbar("panel");

// ─── BOTON CREAR (solo admin) ─────────────────────────────────────────────────
if (usuarioActual.rol !== "Administrador") {
  document.getElementById("btn-nueva-celda")?.remove();
}

// ─── GRID DE CELDAS ───────────────────────────────────────────────────────────
const contenedorGrid = document.getElementById(
  "contenedor-grid",
) as HTMLDivElement;

const coloresSeguiridad: Record<string, string> = {
  Bajo: "border-danger bg-danger bg-opacity-10",
  Medio: "border-warning bg-warning bg-opacity-10",
  Alto: "border-success bg-success bg-opacity-10",
  Extremo: "border-primary bg-primary bg-opacity-10",
};

const badgeSeguiridad: Record<string, string> = {
  Bajo: "bg-danger",
  Medio: "bg-warning text-dark",
  Alto: "bg-success",
  Extremo: "bg-primary",
};

const cargarGrid = async () => {
  try {
    const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.CELDAS, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al cargar las celdas");

    const celdas: any[] = data.data;

    if (celdas.length === 0) {
      contenedorGrid.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-grid fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No hay celdas creadas todavia</h5>
                    ${usuarioActual.rol === "Administrador" ? '<p class="text-secondary">Pulsa "Nueva Celda" para empezar a construir el parque</p>' : ""}
                </div>
            `;
      return;
    }

    const maxFila = Math.max(...celdas.map((c) => c.fila));
    const maxColumna = Math.max(...celdas.map((c) => c.columna));

    const mapaCeldas: Record<string, any> = {};
    celdas.forEach((c) => {
      mapaCeldas[`${c.fila}-${c.columna}`] = c;
    });

    let gridHtml = "";

    for (let f = 1; f <= maxFila; f++) {
      gridHtml += `<div class="d-flex gap-2 mb-2">`;

      for (let col = 1; col <= maxColumna; col++) {
        const celda = mapaCeldas[`${f}-${col}`];

        if (celda) {
          const clasesBorde =
            coloresSeguiridad[celda.nivel_seguridad] || "border-secondary";
          const badgeClase =
            badgeSeguiridad[celda.nivel_seguridad] || "bg-secondary";

          const alimentoColor =
            celda.alimento_porcentaje > 50
              ? "bg-success"
              : celda.alimento_porcentaje > 25
                ? "bg-warning"
                : "bg-danger";

          const botonesAdmin =
            usuarioActual.rol === "Administrador"
              ? `
                        <div class="d-flex gap-1 mt-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill btn-editar-celda"
                                data-id="${celda.id}"
                                data-fila="${celda.fila}"
                                data-columna="${celda.columna}"
                                data-seguridad="${celda.nivel_seguridad}"
                                data-alimento="${celda.alimento_porcentaje}"
                                data-averias="${celda.averias_pendientes}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm flex-fill btn-eliminar-celda" data-id="${celda.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `
              : "";

          gridHtml += `
                        <div class="celda-card border rounded-3 p-2 ${clasesBorde}" style="min-width: 140px; max-width: 140px; cursor: pointer;"
                             data-id="${celda.id}">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted fw-bold">${f},${col}</small>
                                <span class="badge ${badgeClase} rounded-pill" style="font-size: 0.65rem;">${celda.nivel_seguridad}</span>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted">🦕 ${celda.dinosaurios_count} dinos</small>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted">Alimento</small>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar ${alimentoColor}" style="width: ${celda.alimento_porcentaje}%"></div>
                                </div>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted">🔧 Averias: ${celda.averias_pendientes}</small>
                            </div>
                            ${botonesAdmin}
                        </div>
                    `;
        } else {
          gridHtml += `
                        <div class="border border-dashed rounded-3 p-2 bg-white text-center d-flex align-items-center justify-content-center"
                             style="min-width: 140px; max-width: 140px; min-height: 100px; opacity: 0.3;">
                            <small class="text-muted">${f},${col}</small>
                        </div>
                    `;
        }
      }

      gridHtml += `</div>`;
    }

    contenedorGrid.innerHTML = gridHtml;

    contenedorGrid.querySelectorAll(".btn-editar-celda").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const b = btn as HTMLButtonElement;
        abrirModalEditar(
          parseInt(b.dataset.id!),
          parseInt(b.dataset.fila!),
          parseInt(b.dataset.columna!),
          b.dataset.seguridad!,
          parseInt(b.dataset.alimento!),
          parseInt(b.dataset.averias!),
        );
      });
    });

    contenedorGrid.querySelectorAll(".btn-eliminar-celda").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt((btn as HTMLButtonElement).dataset.id!);
        eliminarCelda(id);
      });
    });
  } catch (error: any) {
    contenedorGrid.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
};

// ─── MODAL CREAR / EDITAR ─────────────────────────────────────────────────────
const modalCeldaEl = document.getElementById("modalCelda")!;
const modalCelda = new bootstrap.Modal(modalCeldaEl);
const modalTitulo = document.getElementById("modal-celda-titulo")!;
const inputCeldaId = document.getElementById("celda-id") as HTMLInputElement;
const inputFila = document.getElementById("celda-fila") as HTMLInputElement;
const inputColumna = document.getElementById(
  "celda-columna",
) as HTMLInputElement;
const selectSeguridad = document.getElementById(
  "celda-seguridad",
) as HTMLSelectElement;
const inputAlimento = document.getElementById(
  "celda-alimento",
) as HTMLInputElement;
const inputAverias = document.getElementById(
  "celda-averias",
) as HTMLInputElement;
const alertModal = document.getElementById("alert-modal") as HTMLDivElement;

const abrirModalCrear = () => {
  modalTitulo.innerText = "Nueva Celda";
  inputCeldaId.value = "";
  inputFila.value = "";
  inputColumna.value = "";
  selectSeguridad.value = "Medio";
  inputAlimento.value = "100";
  inputAverias.value = "0";
  alertModal.classList.add("d-none");
  modalCelda.show();
};

const abrirModalEditar = (
  id: number,
  fila: number,
  columna: number,
  seguridad: string,
  alimento: number,
  averias: number,
) => {
  modalTitulo.innerText = "Editar Celda";
  inputCeldaId.value = String(id);
  inputFila.value = String(fila);
  inputColumna.value = String(columna);
  selectSeguridad.value = seguridad;
  inputAlimento.value = String(alimento);
  inputAverias.value = String(averias);
  alertModal.classList.add("d-none");
  modalCelda.show();
};

document
  .getElementById("btn-nueva-celda")
  ?.addEventListener("click", abrirModalCrear);

// ─── GUARDAR CELDA (crear o editar) ───────────────────────────────────────────
document
  .getElementById("btn-guardar-celda")
  ?.addEventListener("click", async () => {
    const id = inputCeldaId.value;
    const esEdicion = id !== "";

    const body = {
      fila: parseInt(inputFila.value),
      columna: parseInt(inputColumna.value),
      nivel_seguridad: selectSeguridad.value,
      alimento_porcentaje: parseInt(inputAlimento.value),
      averias_pendientes: parseInt(inputAverias.value),
    };

    const url = esEdicion
      ? `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}/${id}`
      : `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || "Error al guardar";
        if (data.errores) {
          msg = Object.values(data.errores).flat().join("<br>");
        }
        alertModal.className = "alert alert-danger";
        alertModal.innerHTML = msg;
        return;
      }

      modalCelda.hide();
      cargarGrid();
    } catch (error) {
      alertModal.className = "alert alert-danger";
      alertModal.innerHTML = "Error de conexion";
    }
  });

// ─── ELIMINAR CELDA ───────────────────────────────────────────────────────────
let celdaIdAEliminar: number | null = null;

const modalConfirmarBorradoEl = document.getElementById(
  "modalConfirmarBorrado",
)!;
const modalConfirmarBorrado = new bootstrap.Modal(modalConfirmarBorradoEl);

const eliminarCelda = (id: number) => {
  celdaIdAEliminar = id;
  modalConfirmarBorrado.show();
};

document
  .getElementById("btn-confirmar-borrado")
  ?.addEventListener("click", async () => {
    if (celdaIdAEliminar === null) return;

    try {
      const res = await fetch(
        `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}/${celdaIdAEliminar}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await res.json();
      modalConfirmarBorrado.hide();
      celdaIdAEliminar = null;

      if (res.ok) {
        cargarGrid();
      } else {
        alert(data.message || "Error al eliminar la celda");
      }
    } catch (error) {
      alert("Error de conexion");
    }
  });

cargarGrid();
