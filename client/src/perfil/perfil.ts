
import { initNavbar } from "../navbar/navbar";

if (!sessionStorage.getItem("token_jurassic")) {
  window.location.href = "/";
}

const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputRol = document.getElementById("rol") as HTMLInputElement;
const inputNick = document.getElementById("nick") as HTMLInputElement;
const imgPreview = document.getElementById("img-preview") as HTMLImageElement;
const btnLogout = document.getElementById("btn-logout") as HTMLButtonElement;

const form = document.getElementById("form-perfil") as HTMLFormElement;
const alertError = document.getElementById("alert-error") as HTMLDivElement;
const alertSuccess = document.getElementById("alert-success") as HTMLDivElement;

initNavbar("perfil");

const userString = sessionStorage.getItem("user_jurassic");
if (userString) {
  const user = JSON.parse(userString);

  inputEmail.value = user.email;
  inputRol.value = user.rol;
  inputNick.value = user.nick;

  if (user.foto) {
    imgPreview.src = user.foto;
  }
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    sessionStorage.removeItem("token_jurassic");
    sessionStorage.removeItem("user_jurassic");
    window.location.href = "/";
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    alertError.classList.add("d-none");
    alertSuccess.classList.add("d-none");

    const nuevoNick = inputNick.value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const passwordConfirm = (
      document.getElementById("password_confirmation") as HTMLInputElement
    ).value;
    const fotoFile = (document.getElementById("foto") as HTMLInputElement)
      .files?.[0];

    if (password && password !== passwordConfirm) {
      alertError.classList.remove("d-none");
      alertError.innerText = "Las contraseñas no coinciden.";
      return;
    }

    alertSuccess.classList.remove("d-none");
    alertSuccess.classList.replace("alert-success", "alert-info");
    alertSuccess.innerText = "Guardando cambios...";

    const formData = new FormData();
    formData.append("nick", nuevoNick);

    if (password) {
      formData.append("password", password);
      formData.append("password_confirmation", passwordConfirm);
    }

    if (fotoFile) {
      formData.append("foto", fotoFile);
    }

    try {
      const token = sessionStorage.getItem("token_jurassic");

      const response = await fetch(
        "http://127.0.0.1:8000/api/perfil/actualizar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alertSuccess.classList.add("d-none");
        alertError.classList.remove("d-none");

        if (response.status === 401) {
          alertError.innerText =
            "Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.";
          return;
        }

        if (data.errores) {
          let erroresHtml = '<ul class="mb-0">';
          for (const key in data.errores) {
            erroresHtml += `<li>${data.errores[key][0]}</li>`;
          }
          erroresHtml += "</ul>";
          alertError.innerHTML = erroresHtml;
        } else {
          alertError.innerText = data.error || "Error al actualizar el perfil.";
        }
        return;
      }

      alertError.classList.add("d-none");
      alertSuccess.classList.remove("d-none");
      alertSuccess.classList.replace("alert-info", "alert-success");
      alertSuccess.innerText = "¡Tus datos han sido actualizados con éxito!";

      sessionStorage.setItem("user_jurassic", JSON.stringify(data.data));

      if (data.data.foto) {
        imgPreview.src = data.data.foto;
      }

      (document.getElementById("password") as HTMLInputElement).value = "";
      (
        document.getElementById("password_confirmation") as HTMLInputElement
      ).value = "";
      (document.getElementById("foto") as HTMLInputElement).value = "";
    } catch (error) {
      console.error("Error de conexion:", error);
      alertSuccess.classList.add("d-none");
      alertError.classList.remove("d-none");
      alertError.innerText =
        "No se ha podido conectar con el servidor central.";
    }
  });
}
