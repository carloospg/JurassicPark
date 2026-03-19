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

initNavbar("tareas");

const subtitulo = document.getElementById("subtitulo-tareas");
if (subtitulo) {
  subtitulo.innerText = esAdmin
    ? "Todas las tareas del parque"
    : "Tus tareas asignadas";
}

if (!esAdmin) {
  document.getElementById("btn-nueva-tarea")?.remove();
}

let todasLasTareas: any[] = [];
let filtroEstadoActual = "";
let cacheCeldas: any[] = [];
let cacheUsuarios: any[] = [];

// ─── COLORES POR ESTADO ───────────────────────────────────────────────────────
const claseTarjeta: Record<string, string> = {
  Pendiente: "tarea-pendiente",
  "En progreso": "tarea-en-progreso",
  Finalizada: "tarea-finalizada",
};

const badgeEstado: Record<string, string> = {
  Pendiente: "bg-warning text-dark",
  "En progreso": "bg-primary",
  Finalizada: "bg-success",
};

const siguienteEstado: Record<string, string | null> = {
  Pendiente: "En progreso",
  "En progreso": "Finalizada",
  Finalizada: null,
};

const gridTareas = document.getElementById("grid-tareas") as HTMLDivElement;

const renderTareas = (tareas: any[]) => {
  if (tareas.length === 0) {
    gridTareas.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-clipboard-x fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No hay tareas que mostrar</h5>
            </div>
        `;
    return;
  }

  gridTareas.innerHTML = tareas
    .map((t) => {
      const claseCard = claseTarjeta[t.estado] || "";
      const badge = badgeEstado[t.estado] || "bg-secondary";
      const celda = t.celda
        ? `Celda ${t.celda.fila},${t.celda.columna}`
        : "Sin celda";
      const asignados =
        t.usuarios?.map((u: any) => u.nick).join(", ") || "Sin asignar";

      return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card tarea-card border ${claseCard} shadow-sm rounded-4 h-100"
                     data-id="${t.id}"
                     data-tipo="${t.tipo}"
                     data-estado="${t.estado}"
                     data-celda="${t.celda_id ?? ""}"
                     data-usuarios='${JSON.stringify(t.usuarios?.map((u: any) => u.id) ?? [])}'>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${t.tipo}</h6>
                            <span class="badge ${badge} ms-2">${t.estado}</span>
                        </div>
                        <p class="text-muted small mb-1"><i class="bi bi-geo-alt me-1"></i>${celda}</p>
                        <p class="text-muted small mb-0"><i class="bi bi-person me-1"></i>${asignados}</p>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  gridTareas.querySelectorAll(".tarea-card").forEach((card) => {
    card.addEventListener("click", () => {
      const el = card as HTMLElement;
      const id = parseInt(el.dataset.id!);
      const tipo = el.dataset.tipo!;
      const estado = el.dataset.estado!;
      const celdaId = el.dataset.celda ? parseInt(el.dataset.celda) : null;
      const usuariosIds = JSON.parse(el.dataset.usuarios!);
      abrirModalDetalle(id, tipo, estado, celdaId, usuariosIds);
    });
  });
};

// ─── CARGAR TAREAS ────────────────────────────────────────────────────────────
const cargarTareas = async () => {
  gridTareas.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-warning" role="status"></div>
            <p class="text-secondary mt-2">Cargando tareas...</p>
        </div>
    `;
  try {
    const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.TAREAS, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cargar las tareas");
    todasLasTareas = data.data;
    aplicarFiltro();
  } catch (error: any) {
    gridTareas.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
  }
};

// ─── FILTRO POR ESTADO ────────────────────────────────────────────────────────
const aplicarFiltro = () => {
  const filtradas =
    filtroEstadoActual === ""
      ? todasLasTareas
      : todasLasTareas.filter((t) => t.estado === filtroEstadoActual);
  renderTareas(filtradas);
};

document.querySelectorAll(".filtro-estado").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtro-estado").forEach((b) => {
      const el = b as HTMLButtonElement;
      const estado = el.dataset.estado!;
      el.className = "btn btn-sm fw-bold filtro-estado ";
      if (estado === "") el.className += "btn-outline-warning";
      else if (estado === "Pendiente") el.className += "btn-outline-warning";
      else if (estado === "En progreso") el.className += "btn-outline-primary";
      else if (estado === "Finalizada") el.className += "btn-outline-success";
    });
    const b = btn as HTMLButtonElement;
    const estado = b.dataset.estado!;
    b.className = "btn btn-sm fw-bold filtro-estado ";
    if (estado === "") b.className += "btn-warning";
    else if (estado === "Pendiente") b.className += "btn-warning";
    else if (estado === "En progreso") b.className += "btn-primary";
    else if (estado === "Finalizada") b.className += "btn-success";
    filtroEstadoActual = estado;
    aplicarFiltro();
  });
});

// ─── MODAL DETALLE / EDITAR ───────────────────────────────────────────────────
const modalTareaEl = document.getElementById("modalTarea")!;
const modalTarea = new bootstrap.Modal(modalTareaEl);
const modalTitulo = document.getElementById("modal-tarea-titulo")!;
const inputTareaId = document.getElementById("tarea-id") as HTMLInputElement;
const inputTipo = document.getElementById("tarea-tipo") as HTMLInputElement;
const selectEstado = document.getElementById(
  "tarea-estado",
) as HTMLSelectElement;
const selectCelda = document.getElementById("tarea-celda") as HTMLSelectElement;
const selectUsuarios = document.getElementById(
  "tarea-usuarios",
) as HTMLSelectElement;
const alertModalTarea = document.getElementById(
  "alert-modal-tarea",
) as HTMLDivElement;
const botonesAdminTarea = document.getElementById(
  "botones-admin-tarea",
) as HTMLDivElement;
const btnAvanzarEstado = document.getElementById(
  "btn-avanzar-estado-modal",
) as HTMLButtonElement;

const cargarSelectoresModal = async (
  celdaSeleccionada: number | null,
  usuariosSeleccionados: number[],
) => {
  if (cacheCeldas.length === 0) {
    const resCeldas = await fetch(
      CONSTANTS.API.BASE_URL + CONSTANTS.API.CELDAS,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const dataCeldas = await resCeldas.json();
    cacheCeldas = dataCeldas.data ?? [];
  }

  if (esAdmin && cacheUsuarios.length === 0) {
    const resUsuarios = await fetch(
      CONSTANTS.API.BASE_URL + CONSTANTS.API.USERS,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const dataUsuarios = await resUsuarios.json();
    cacheUsuarios = (dataUsuarios.data ?? []).filter(
      (u: any) => u.rol !== "Administrador",
    );
  }

  selectCelda.innerHTML = cacheCeldas
    .map(
      (c: any) =>
        `<option value="${c.id}" ${c.id === celdaSeleccionada ? "selected" : ""}>Celda ${c.fila},${c.columna} - ${c.nivel_seguridad}</option>`,
    )
    .join("");

  selectUsuarios.innerHTML = cacheUsuarios
    .map(
      (u: any) =>
        `<option value="${u.id}" ${usuariosSeleccionados.includes(u.id) ? "selected" : ""}>${u.nick} (${u.rol})</option>`,
    )
    .join("");
};

const abrirModalDetalle = async (
  id: number,
  tipo: string,
  estado: string,
  celdaId: number | null,
  usuariosIds: number[],
) => {
  modalTitulo.innerText = tipo;
  inputTareaId.value = String(id);
  inputTipo.value = tipo;
  selectEstado.value = estado;
  alertModalTarea.classList.add("d-none");

  if (esAdmin) {
    inputTipo.disabled = false;
    selectEstado.disabled = false;
    selectCelda.disabled = false;
    selectUsuarios.disabled = false;
    botonesAdminTarea.classList.remove("d-none");
    btnAvanzarEstado.classList.add("d-none");
    selectCelda.classList.remove("d-none");
    document.getElementById("link-ver-celda")?.classList.add("d-none");
  } else {
    // Vet/Mantenimiento: campos de solo lectura
    inputTipo.disabled = true;
    selectEstado.disabled = true;
    selectCelda.disabled = true;
    selectUsuarios.disabled = true;
    botonesAdminTarea.classList.add("d-none");

    await cargarSelectoresModal(celdaId, usuariosIds);

    // Ocultamos el select y mostramos un enlace al panel
    selectCelda.classList.add("d-none");
    const linkCelda = document.getElementById(
      "link-ver-celda",
    ) as HTMLAnchorElement;
    const textoCelda = document.getElementById(
      "texto-celda-link",
    ) as HTMLSpanElement;
    const celdaInfo = cacheCeldas.find((c: any) => c.id === celdaId);
    if (celdaInfo && linkCelda && textoCelda) {
      textoCelda.innerText = `Ver Celda ${celdaInfo.fila},${celdaInfo.columna} en el mapa`;
      linkCelda.href = `${CONSTANTS.ROUTES.PANEL}?celda=${celdaId}`;
      linkCelda.classList.remove("d-none");
    }

    const siguiente = siguienteEstado[estado];
    if (siguiente) {
      btnAvanzarEstado.classList.remove("d-none");
      btnAvanzarEstado.innerText =
        estado === "Pendiente" ? "Iniciar tarea" : "Finalizar tarea";
      btnAvanzarEstado.dataset.id = String(id);
      btnAvanzarEstado.dataset.siguiente = siguiente;
    } else {
      btnAvanzarEstado.classList.add("d-none");
    }
  }

  if (esAdmin) {
    await cargarSelectoresModal(celdaId, usuariosIds);
  }
  modalTarea.show();
};

// Boton avanzar estado para veterinario/mantenimiento
btnAvanzarEstado?.addEventListener("click", async () => {
  const id = btnAvanzarEstado.dataset.id!;
  const siguiente = btnAvanzarEstado.dataset.siguiente!;

  try {
    const res = await fetch(
      `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.TAREAS}/${id}/estado`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ estado: siguiente }),
      },
    );
    const data = await res.json();
    if (res.ok) {
      modalTarea.hide();
      cargarTareas();

    } else {
      alertModalTarea.className = "alert alert-danger";
      alertModalTarea.innerHTML = data.message || "Error al cambiar estado";
    }
  } catch {
    alertModalTarea.className = "alert alert-danger";
    alertModalTarea.innerHTML = "Error de conexion";
  }
});

// Boton nueva tarea
document
  .getElementById("btn-nueva-tarea")
  ?.addEventListener("click", async () => {
    modalTitulo.innerText = "Nueva Tarea";
    inputTareaId.value = "";
    inputTipo.value = "";
    selectEstado.value = "Pendiente";
    alertModalTarea.classList.add("d-none");
    inputTipo.disabled = false;
    selectEstado.disabled = false;
    selectCelda.disabled = false;
    selectUsuarios.disabled = false;
    botonesAdminTarea.classList.remove("d-none");
    btnAvanzarEstado.classList.add("d-none");
    await cargarSelectoresModal(null, []);
    modalTarea.show();
  });

// ─── GUARDAR TAREA (crear o editar) ──────────────────────────────────────────
document
  .getElementById("btn-guardar-tarea")
  ?.addEventListener("click", async () => {
    const id = inputTareaId.value;
    const esEdicion = id !== "";
    const selected = Array.from(selectUsuarios.selectedOptions).map((o) =>
      parseInt(o.value),
    );

    if (esEdicion) {
      try {
        const res = await fetch(
          `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.TAREAS}/${id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              tipo: inputTipo.value,
              celda_id: parseInt(selectCelda.value),
              usuarios_ids: selected,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          alertModalTarea.className = "alert alert-danger";
          alertModalTarea.innerHTML = data.message || "Error al actualizar";
          return;
        }

        const tareaActual = todasLasTareas.find((t) => t.id === parseInt(id));
        if (tareaActual && selectEstado.value !== tareaActual.estado) {
          const resEstado = await fetch(
            `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.TAREAS}/${id}/estado`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ estado: selectEstado.value }),
            },
          );
          const dataEstado = await resEstado.json();
          if (!resEstado.ok) {
            alertModalTarea.className = "alert alert-danger";
            alertModalTarea.innerHTML =
              dataEstado.message || "Error al cambiar estado";
            return;
          }
        }

        modalTarea.hide();
        cargarTareas();
      } catch {
        alertModalTarea.className = "alert alert-danger";
        alertModalTarea.innerHTML = "Error de conexion";
      }
    } else {
      try {
        const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.TAREAS, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            tipo: inputTipo.value,
            celda_id: parseInt(selectCelda.value),
            usuarios_ids: selected,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          let msg = data.message || "Error al crear la tarea";
          if (data.errores)
            msg = Object.values(data.errores).flat().join("<br>");
          alertModalTarea.className = "alert alert-danger";
          alertModalTarea.innerHTML = msg;
          return;
        }
        modalTarea.hide();
        cargarTareas();
      } catch {
        alertModalTarea.className = "alert alert-danger";
        alertModalTarea.innerHTML = "Error de conexion";
      }
    }
  });

// ─── ELIMINAR TAREA ───────────────────────────────────────────────────────────
let tareaIdAEliminar: number | null = null;
const modalConfirmarBorradoEl = document.getElementById(
  "modalConfirmarBorradoTarea",
)!;
const modalConfirmarBorrado = new bootstrap.Modal(modalConfirmarBorradoEl);

document
  .getElementById("btn-eliminar-tarea-modal")
  ?.addEventListener("click", () => {
    tareaIdAEliminar = parseInt(inputTareaId.value);
    modalTarea.hide();
    modalTareaEl.addEventListener(
      "hidden.bs.modal",
      () => {
        modalConfirmarBorrado.show();
      },
      { once: true },
    );
  });

document
  .getElementById("btn-confirmar-borrado-tarea")
  ?.addEventListener("click", async () => {
    if (tareaIdAEliminar === null) return;
    try {
      const res = await fetch(
        `${CONSTANTS.API.BASE_URL}${CONSTANTS.API.TAREAS}/${tareaIdAEliminar}`,
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
      tareaIdAEliminar = null;
      if (res.ok) {
        cargarTareas();
      } else {
        alert(data.message || "Error al eliminar la tarea");
      }
    } catch {
      alert("Error de conexion");
    }
  });

cargarTareas();

escucharTareas(() => cargarTareas());
escucharSimulaciones(() => cargarTareas());
window.addEventListener("beforeunload", desconectar);