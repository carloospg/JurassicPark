import CONSTANTS from "../constants";
import { initNavbar } from "../navbar/navbar";

declare const bootstrap: any;

const token = sessionStorage.getItem("token_jurassic");
const userString = sessionStorage.getItem("user_jurassic");

if (!token || !userString) {
  window.location.href = "/";
}

const usuarioActual = JSON.parse(userString!);
const esAdmin = usuarioActual.rol === "Administrador";

initNavbar("panel");

if (!esAdmin) {
  document.getElementById("btn-nueva-celda")?.remove();
}

// ─── COLORES ──────────────────────────────────────────────────────────────────
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

// ─── GRID DE CELDAS ───────────────────────────────────────────────────────────
const contenedorGrid = document.getElementById(
  "contenedor-grid",
) as HTMLDivElement;

const cargarGrid = async () => {
  try {
    const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.CELDAS, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cargar las celdas");

    const celdas: any[] = data.data;

    if (celdas.length === 0) {
      contenedorGrid.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-grid fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No hay celdas creadas todavia</h5>
                    ${esAdmin ? '<p class="text-secondary">Pulsa "Nueva Celda" para empezar a construir el parque</p>' : ""}
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
      // Cada fila usa CSS grid con tantas columnas como maxColumna
      // para que las celdas ocupen siempre el ancho completo de la pagina
      gridHtml += `<div class="grid-fila" style="grid-template-columns: repeat(${maxColumna}, 1fr);">`;

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

          gridHtml += `
                        <div class="celda-card border rounded-3 p-2 ${clasesBorde}"
                             data-id="${celda.id}"
                             data-fila="${celda.fila}"
                             data-columna="${celda.columna}"
                             data-seguridad="${celda.nivel_seguridad}"
                             data-alimento="${celda.alimento_porcentaje}"
                             data-averias="${celda.averias_pendientes}">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted fw-bold">${f},${col}</small>
                                <span class="badge ${badgeClase} rounded-pill" style="font-size:0.65rem">${celda.nivel_seguridad}</span>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted fw-bold">🦕 ${celda.dinosaurios?.length ?? 0} dinos</small>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted">Alimento</small>
                                <div class="progress" style="height:6px">
                                    <div class="progress-bar ${alimentoColor}" style="width:${celda.alimento_porcentaje}%"></div>
                                </div>
                            </div>
                            <div class="mb-1">
                                <small class="text-muted">🔧 Averias: ${celda.averias_pendientes}</small>
                            </div>
                        </div>
                    `;
        } else {
          gridHtml += `
                        <div class="celda-vacia border border-dashed rounded-3 p-2 bg-white text-center d-flex align-items-center justify-content-center">
                            <small class="text-muted">${f},${col}</small>
                        </div>
                    `;
        }
      }

      gridHtml += `</div>`;
    }

    contenedorGrid.innerHTML = gridHtml;

    contenedorGrid.querySelectorAll(".celda-card").forEach((card) => {
      card.addEventListener("click", () => {
        const el = card as HTMLElement;
        abrirModalDetalle(
          parseInt(el.dataset.id!),
          parseInt(el.dataset.fila!),
          parseInt(el.dataset.columna!),
          el.dataset.seguridad!,
          parseInt(el.dataset.alimento!),
          parseInt(el.dataset.averias!),
        );
      });
    });
  } catch (error: any) {
    contenedorGrid.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
};

// ─── MODAL DETALLE / EDITAR CELDA ─────────────────────────────────────────────
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
const listaDinos = document.getElementById(
  "lista-dinos-modal",
) as HTMLDivElement;
const botonesAdmin = document.getElementById(
  "botones-admin-modal",
) as HTMLDivElement;

const abrirModalDetalle = async (
  id: number,
  fila: number,
  columna: number,
  seguridad: string,
  alimento: number,
  averias: number,
) => {
  modalTitulo.innerText = `Celda ${fila}, ${columna}`;
  inputCeldaId.value = String(id);
  inputFila.value = String(fila);
  inputColumna.value = String(columna);
  selectSeguridad.value = seguridad;
  inputAlimento.value = String(alimento);
  inputAverias.value = String(averias);
  alertModal.classList.add("d-none");
  listaDinos.innerHTML = '<span class="text-muted small">Cargando...</span>';

  const campos = [inputFila, inputColumna, inputAlimento, inputAverias];
  campos.forEach((c) => (c.disabled = !esAdmin));
  selectSeguridad.disabled = !esAdmin;

  botonesAdmin.style.display = esAdmin ? "flex" : "none";

  modalCelda.show();

  try {
    const res = await fetch(
      `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const data = await res.json();

    if (res.ok && data.data.dinosaurios?.length > 0) {
      listaDinos.innerHTML = data.data.dinosaurios
        .map(
          (d: any) => `
                <a href="/src/dinosaurios/dinosaurios.html?id=${d.id}"
                   class="dino-modal-item d-flex align-items-center gap-2 text-decoration-none text-dark">
                    <span class="fw-bold">${d.nick}</span>
                    <small class="text-muted">${d.especie?.nombre ?? ""}</small>
                    <i class="bi bi-box-arrow-up-right ms-auto text-muted" style="font-size:11px"></i>
                </a>
            `,
        )
        .join("");
    } else {
      listaDinos.innerHTML =
        '<span class="text-muted small">No hay dinosaurios en esta celda</span>';
    }
  } catch {
    listaDinos.innerHTML =
      '<span class="text-muted small">Error al cargar dinosaurios</span>';
  }
};

// ─── GUARDAR CAMBIOS EN CELDA EXISTENTE ───────────────────────────────────────
document
  .getElementById("btn-guardar-celda")
  ?.addEventListener("click", async () => {
    const id = inputCeldaId.value;

    const body = {
      fila: parseInt(inputFila.value),
      columna: parseInt(inputColumna.value),
      nivel_seguridad: selectSeguridad.value,
      alimento_porcentaje: parseInt(inputAlimento.value),
      averias_pendientes: parseInt(inputAverias.value),
    };

    try {
      const res = await fetch(
        `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || "Error al guardar";
        if (data.errores) msg = Object.values(data.errores).flat().join("<br>");
        alertModal.className = "alert alert-danger";
        alertModal.innerHTML = msg;
        return;
      }

      modalCelda.hide();
      cargarGrid();
    } catch {
      alertModal.className = "alert alert-danger";
      alertModal.innerHTML = "Error de conexion";
    }
  });

// ─── ELIMINAR DESDE EL MODAL ──────────────────────────────────────────────────
let celdaIdAEliminar: number | null = null;
const modalConfirmarBorradoEl = document.getElementById(
  "modalConfirmarBorrado",
)!;
const modalConfirmarBorrado = new bootstrap.Modal(modalConfirmarBorradoEl);

document
  .getElementById("btn-eliminar-desde-modal")
  ?.addEventListener("click", () => {
    celdaIdAEliminar = parseInt(inputCeldaId.value);
    modalCelda.hide();
    modalCeldaEl.addEventListener(
      "hidden.bs.modal",
      () => {
        modalConfirmarBorrado.show();
      },
      { once: true },
    );
  });

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
    } catch {
      alert("Error de conexion");
    }
  });

// ─── MODAL NUEVA CELDA ────────────────────────────────────────────────────────
const modalNuevaCeldaEl = document.getElementById("modalNuevaCelda")!;
const modalNuevaCelda = new bootstrap.Modal(modalNuevaCeldaEl);
const alertModalNueva = document.getElementById(
  "alert-modal-nueva",
) as HTMLDivElement;

document.getElementById("btn-nueva-celda")?.addEventListener("click", () => {
  (document.getElementById("nueva-celda-fila") as HTMLInputElement).value = "";
  (document.getElementById("nueva-celda-columna") as HTMLInputElement).value =
    "";
  (
    document.getElementById("nueva-celda-seguridad") as HTMLSelectElement
  ).value = "Medio";
  (document.getElementById("nueva-celda-alimento") as HTMLInputElement).value =
    "100";
  (document.getElementById("nueva-celda-averias") as HTMLInputElement).value =
    "0";
  alertModalNueva.classList.add("d-none");
  modalNuevaCelda.show();
});

document
  .getElementById("btn-guardar-nueva-celda")
  ?.addEventListener("click", async () => {
    const body = {
      fila: parseInt(
        (document.getElementById("nueva-celda-fila") as HTMLInputElement).value,
      ),
      columna: parseInt(
        (document.getElementById("nueva-celda-columna") as HTMLInputElement)
          .value,
      ),
      nivel_seguridad: (
        document.getElementById("nueva-celda-seguridad") as HTMLSelectElement
      ).value,
      alimento_porcentaje: parseInt(
        (document.getElementById("nueva-celda-alimento") as HTMLInputElement)
          .value,
      ),
      averias_pendientes: parseInt(
        (document.getElementById("nueva-celda-averias") as HTMLInputElement)
          .value,
      ),
    };

    try {
      const res = await fetch(
        `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || "Error al crear";
        if (data.errores) msg = Object.values(data.errores).flat().join("<br>");
        alertModalNueva.className = "alert alert-danger";
        alertModalNueva.innerHTML = msg;
        return;
      }

      modalNuevaCelda.hide();
      cargarGrid();
    } catch {
      alertModalNueva.className = "alert alert-danger";
      alertModalNueva.innerHTML = "Error de conexion";
    }
  });

const params = new URLSearchParams(window.location.search);
const celdaParam = params.get("celda");

if (celdaParam) {
  cargarGrid().then(async () => {
    try {
      const res = await fetch(
        `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.CELDAS}/${celdaParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        const c = data.data;
        abrirModalDetalle(
          c.id,
          c.fila,
          c.columna,
          c.nivel_seguridad,
          c.alimento_porcentaje,
          c.averias_pendientes,
        );
      }
    } catch (e) {
      console.error("Error al abrir celda desde URL", e);
    }
  });
} else {
  cargarGrid();
}
