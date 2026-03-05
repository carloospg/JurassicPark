// --- GUARDIA DE RUTA ---
if (localStorage.getItem('token_jurassic')) {
    window.location.href = '/';
}

const form = document.getElementById('form-login') as HTMLFormElement;
const alertError = document.getElementById('alert-error') as HTMLDivElement;
const alertSuccess = document.getElementById('alert-success') as HTMLDivElement;

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ocultamos alertas previas
        alertError.classList.add('d-none');
        alertSuccess.classList.add('d-none');
        alertError.innerHTML = '';

        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        // Como no hay archivos, armamos un objeto JS normal
        const datosLogin = {
            email: email,
            password: password
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                // Lo convertimos a JSON y le decimos al backend que le mandamos un JSON
                body: JSON.stringify(datosLogin),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            // Si hay errores (401 credenciales incorrectas o 422 validacion)
            if (!response.ok) {
                alertError.classList.remove('d-none');
                
                if (data.errores) {
                    let erroresHtml = '<ul class="mb-0">';
                    for (const key in data.errores) {
                        erroresHtml += `<li>${data.errores[key][0]}</li>`;
                    }
                    erroresHtml += '</ul>';
                    alertError.innerHTML = erroresHtml;
                } else {
                    alertError.innerText = data.message || 'Error en las credenciales.';
                }
                return;
            }

            // Exito (200 OK)
            alertSuccess.classList.remove('d-none');
            alertSuccess.innerText = 'Acceso autorizado. Redirigiendo...';
            
            // Guardamos el token y los datos del usuario en localStorage
            localStorage.setItem('token_jurassic', data.data.token);
            localStorage.setItem('user_jurassic', JSON.stringify(data.data));

            // Redirigimos al inicio despues de 1 segundo
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            console.error('Error de conexion:', error);
            alertError.classList.remove('d-none');
            alertError.innerText = 'Error de conexion con el servidor central.';
        }
    });
}