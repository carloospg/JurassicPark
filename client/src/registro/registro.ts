if (localStorage.getItem('token_jurassic')) {
    window.location.href = '/';
}

const form = document.getElementById('form-registro') as HTMLFormElement;
const alertError = document.getElementById('alert-error') as HTMLDivElement;
const alertSuccess = document.getElementById('alert-success') as HTMLDivElement;

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        alertError.classList.add('d-none');
        alertSuccess.classList.add('d-none');
        alertError.innerHTML = '';

        const nick = (document.getElementById('nick') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const password_confirmation = (document.getElementById('password_confirmation') as HTMLInputElement).value;
        const fotoInput = document.getElementById('foto') as HTMLInputElement;

        const formData = new FormData();
        formData.append('nick', nick);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('password_confirmation', password_confirmation);

        if (fotoInput.files && fotoInput.files.length > 0) {
            formData.append('foto', fotoInput.files[0]);
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/registro', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

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
                    alertError.innerText = data.error || 'Error en el servidor.';
                }
                return;
            }

            alertSuccess.classList.remove('d-none');
            alertSuccess.innerText = data.message || 'Registro completado con exito.';
            form.reset();

            if (data.data && data.data.token) {
                localStorage.setItem('token_jurassic', data.data.token);
                localStorage.setItem('user_jurassic', JSON.stringify(data.data));
            }

            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);

        } catch (error) {
            console.error('Error de conexion:', error);
            alertError.classList.remove('d-none');
            alertError.innerText = 'Error de conexion. Comprueba si el servidor esta encendido.';
        }
    });
}