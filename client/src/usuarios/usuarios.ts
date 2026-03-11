import CONSTANTS from "../constants";

declare const bootstrap: any;

const token = localStorage.getItem("token_jurassic");
const userString = localStorage.getItem("user_jurassic");

if (!token || !userString) {
  window.location.href = "/";
}

const usuarioActual = JSON.parse(userString!);
if (usuarioActual.rol !== "Administrador") {
  alert("Acceso denegado. Área exclusiva de la Administración.");
  window.location.href = "/";
}

const navUserName = document.getElementById("nav-user-name");
const navUserFoto = document.getElementById(
  "nav-user-foto",
) as HTMLImageElement;

if (navUserName) navUserName.innerText = usuarioActual.nick;
if (navUserFoto && usuarioActual.foto) {
  navUserFoto.src = usuarioActual.foto;
  navUserFoto.style.display = "block";
}

document.getElementById("btn-logout-nav")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});

const gridUsuarios = document.getElementById("grid-usuarios") as HTMLDivElement;
const alertaGeneral = document.getElementById(
  "alerta-general",
) as HTMLDivElement;

const modalRol = new bootstrap.Modal(document.getElementById("modalEditarRol"));

const mostrarAlerta = (mensaje: string, tipo: "success" | "danger") => {
  alertaGeneral.className = `alert alert-${tipo} alert-dismissible fade show mb-4`;
  alertaGeneral.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
};

const cargarUsuarios = async () => {
  try {
    const res = await fetch(CONSTANTS.API.BASE_URL + CONSTANTS.API.USERS, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al cargar usuarios");

    gridUsuarios.innerHTML = "";

    data.data.forEach((u: any) => {
      const esElMismo = u.id === usuarioActual.id;
      const botonesHtml = esElMismo
        ? `<span class="text-success small fw-bold">Tú (Admin)</span>`
        : `
                    <button class="btn btn-outline-primary btn-sm me-1 fw-bold btn-editar" data-id="${u.id}" data-nick="${u.nick}" data-rol="${u.rol}">
                        <i class="bi bi-pencil-square me-1"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm fw-bold btn-borrar" data-id="${u.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                `;

      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 col-xl-3";
      col.innerHTML = `
                <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="bg-dark p-3 text-center position-relative">
                        <img src="${u.foto || "https://via.placeholder.com/90"}" alt="${u.nick}" class="rounded-circle object-fit-cover border border-3 border-white shadow" style="width: 90px; height: 90px;">
                    </div>
                    <div class="card-body text-center mt-2">
                        <h5 class="card-title fw-bold mb-1">${u.nick}</h5>
                        <p class="text-muted small mb-3">${u.email}</p>
                        <span class="badge ${u.rol === "Administrador" ? "bg-danger" : "bg-primary"} mb-2 px-3 py-2 rounded-pill">${u.rol}</span>
                    </div>
                    <div class="card-footer bg-light border-0 text-center pb-3 pt-0">
                        ${botonesHtml}
                    </div>
                </div>
            `;
      gridUsuarios.appendChild(col);
    });
  } catch (error: any) {
    gridUsuarios.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
  }
};

gridUsuarios.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;

  // BOTÓN BORRAR
  const btnBorrar = target.closest(".btn-borrar") as HTMLButtonElement;
  if (btnBorrar) {
    const id = btnBorrar.getAttribute("data-id");
    if (
      confirm(
        "¿Peligro: Estás seguro de que quieres dar de baja a este empleado? Esta acción no se puede deshacer.",
      )
    ) {
      try {
        const res = await fetch(`${CONSTANTS.API.BASE_URL}${CONSTANTS.API.USERS}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const data = await res.json();
        if (res.ok) {
          mostrarAlerta(data.message, "success");
          cargarUsuarios();
        } else {
          mostrarAlerta(data.message, "danger");
        }
      } catch (error) {
        mostrarAlerta("Error de conexión.", "danger");
      }
    }
  }

  const btnEditar = target.closest(".btn-editar") as HTMLButtonElement;
  if (btnEditar) {
    const id = btnEditar.getAttribute("data-id")!;
    const nick = btnEditar.getAttribute("data-nick")!;
    const rolActual = btnEditar.getAttribute("data-rol")!;

    (
      document.getElementById("modal-nombre-empleado") as HTMLElement
    ).innerText = nick;
    (document.getElementById("modal-id-empleado") as HTMLInputElement).value =
      id;
    (document.getElementById("select-nuevo-rol") as HTMLSelectElement).value =
      rolActual;

    modalRol.show();
  }
});

document
  .getElementById("btn-guardar-rol")
  ?.addEventListener("click", async () => {
    const id = (
      document.getElementById("modal-id-empleado") as HTMLInputElement
    ).value;
    const nuevoRol = (
      document.getElementById("select-nuevo-rol") as HTMLSelectElement
    ).value;

    try {
      const res = await fetch(`${CONSTANTS.API.BASE_URL}${CONSTANTS.API.USERS}/${id}/rol`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      const data = await res.json();

      if (res.ok) {
        modalRol.hide();
        mostrarAlerta(data.message, "success");
        cargarUsuarios();
      } else {
        alert(data.message || "Error al validar el rol");
      }
    } catch (error) {
      alert("Error de conexión al guardar.");
    }
  });

cargarUsuarios();
