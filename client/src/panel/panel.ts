import CONSTANTS from "../constants";
import { initNavbar } from "../navbar/navbar";
import { desconectar, escucharSimulaciones, escucharTareas } from "../notificaciones";

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
  document.getElementById("btn-simulacion-normal")?.remove();
  document.getElementById("btn-simulacion-brecha")?.remove();
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

// ─── SIMULACION NORMAL ────────────────────────────────────────────────────────
const modalSimulacionEl = document.getElementById("modalSimulacion")!;
const modalSimulacion = new bootstrap.Modal(modalSimulacionEl);
const modalSimulacionBody = document.getElementById(
  "modal-simulacion-body",
) as HTMLDivElement;

document
  .getElementById("btn-simulacion-normal")
  ?.addEventListener("click", async () => {
    modalSimulacionBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-danger" role="status"></div>
            <p class="text-secondary mt-2">Ejecutando simulacion...</p>
        </div>
    `;
    modalSimulacion.show();

    try {
      const res = await fetch(`${CONSTANTS.API.BASE_URL}simulaciones/normal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        modalSimulacionBody.innerHTML = `<div class="alert alert-danger">${data.message || "Error en la simulacion"}</div>`;
        return;
      }

      const resultado = data.data;

      // Construyo el resumen de resultados
      const celdasHtml = resultado.celdas
        .map((c: any) => {
          const cambiosHtml =
            c.cambios.length > 0
              ? c.cambios
                  .map((cambio: string) => `<li class="small">${cambio}</li>`)
                  .join("")
              : '<li class="small text-muted">Sin cambios</li>';

          const colorAlimento =
            c.alimento_despues > 50
              ? "text-success"
              : c.alimento_despues > 25
                ? "text-warning"
                : "text-danger";

          return `
                <div class="col-12 col-md-6 col-lg-4 mb-3">
                    <div class="card border shadow-sm rounded-3 h-100">
                        <div class="card-header bg-dark text-white py-2">
                            <small class="fw-bold">${c.posicion}</small>
                        </div>
                        <div class="card-body py-2">
                            <p class="mb-1 small">
                                Alimento: <span class="fw-bold">${c.alimento_antes}%</span>
                                <i class="bi bi-arrow-right mx-1"></i>
                                <span class="fw-bold ${colorAlimento}">${c.alimento_despues}%</span>
                            </p>
                            <p class="mb-1 small">Averias: <span class="fw-bold">${c.averias_despues}</span></p>
                            <ul class="mb-0 ps-3">${cambiosHtml}</ul>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

      modalSimulacionBody.innerHTML = `
            <div class="alert alert-warning mb-3">
                <i class="bi bi-lightning-charge-fill me-2"></i>
                <strong>Simulacion completada:</strong>
                ${resultado.total_celdas} celdas afectadas,
                ${resultado.tareas_creadas} tareas creadas automaticamente
            </div>
            <div class="row g-2">
                ${celdasHtml}
            </div>
        `;

      cargarGrid();
    } catch {
      modalSimulacionBody.innerHTML = `<div class="alert alert-danger">Error de conexion</div>`;
    }
  });

// ─── SIMULACION BRECHA ────────────────────────────────────────────────────────
const modalLanzarBrechaEl = document.getElementById("modalLanzarBrecha")!;
const modalLanzarBrecha = new bootstrap.Modal(modalLanzarBrechaEl);
const modalResultadoBrechaEl = document.getElementById("modalResultadoBrecha")!;
const modalResultadoBrecha = new bootstrap.Modal(modalResultadoBrechaEl);
const brechaCeldaSelect = document.getElementById(
  "brecha-celda-select",
) as HTMLSelectElement;
const modalBrechaBody = document.getElementById(
  "modal-brecha-body",
) as HTMLDivElement;
const brechaHeader = document.getElementById("brecha-header") as HTMLDivElement;
const brechaTitulo = document.getElementById(
  "brecha-titulo",
) as HTMLHeadingElement;

document
  .getElementById("btn-simulacion-brecha")
  ?.addEventListener("click", async () => {
    try {
      const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.CELDAS, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      brechaCeldaSelect.innerHTML =
        '<option value="">Aleatoria</option>' +
        data.data
          .map(
            (c: any) =>
              `<option value="${c.id}">Celda ${c.fila},${c.columna} - ${c.nivel_seguridad}</option>`,
          )
          .join("");
    } catch {
      brechaCeldaSelect.innerHTML = '<option value="">Aleatoria</option>';
    }
    modalLanzarBrecha.show();
  });

document
  .getElementById("btn-confirmar-brecha")
  ?.addEventListener("click", async () => {
    const celdaId = brechaCeldaSelect.value;
    modalLanzarBrecha.hide();

    modalBrechaBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-danger" role="status"></div>
            <p class="text-secondary mt-2">Ejecutando simulacion de brecha...</p>
        </div>
    `;
    brechaHeader.className = "modal-header bg-danger text-white";
    modalLanzarBrechaEl.addEventListener(
      "hidden.bs.modal",
      () => {
        modalResultadoBrecha.show();
      },
      { once: true },
    );

    try {
      const body: any = celdaId ? { celda_id: parseInt(celdaId) } : {};
      const res = await fetch(`${CONSTANTS.API.BASE_URL}simulaciones/brecha`, {
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
        modalBrechaBody.innerHTML = `<div class="alert alert-danger">${data.message || "Error en la simulacion"}</div>`;
        return;
      }

      const r = data.data;
      const contenida = r.brecha_contenida;

      // Cambio el color del header segun el resultado
      brechaHeader.className = contenida
        ? "modal-header bg-success text-white"
        : "modal-header bg-danger text-white";
      brechaTitulo.innerHTML = contenida
        ? '<i class="bi bi-shield-check me-2"></i>Brecha Contenida'
        : '<i class="bi bi-exclamation-triangle-fill me-2"></i>ALERTA: Brecha No Contenida';

      const factoresHtml = r.factores
        .map((f: string) => `<li class="small">${f}</li>`)
        .join("");

      const alertClass = contenida ? "alert-success" : "alert-danger";
      const iconoRes = contenida ? "bi-shield-check" : "bi-exclamation-octagon";

      modalBrechaBody.innerHTML = `
            <div class="alert ${alertClass} mb-3">
                <i class="bi ${iconoRes} me-2"></i>
                <strong>${data.message}</strong>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <div class="card border text-center p-3">
                        <h2 class="fw-bold ${contenida ? "text-success" : "text-danger"}">${r.puntuacion}</h2>
                        <small class="text-muted">Puntuacion de riesgo</small>
                        <small class="text-muted d-block">(umbral de fuga: 60)</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border text-center p-3">
                        <h5 class="fw-bold mb-1">${r.posicion}</h5>
                        <small class="text-muted">Celda afectada</small>
                    </div>
                </div>
            </div>
            <div class="mb-2">
                <p class="fw-bold mb-1">Factores de riesgo:</p>
                <ul class="mb-0">${factoresHtml || '<li class="small text-muted">Sin factores de riesgo</li>'}</ul>
            </div>
            ${!contenida ? `<div class="alert alert-warning mt-3 mb-0 small"><i class="bi bi-tools me-1"></i>Se ha creado una tarea de emergencia y se han generado averias adicionales en la celda.</div>` : ""}
        `;

      cargarGrid();
    } catch {
      modalBrechaBody.innerHTML = `<div class="alert alert-danger">Error de conexion</div>`;
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

escucharTareas(() => {});
escucharSimulaciones(() => cargarGrid());
window.addEventListener("beforeunload", desconectar);