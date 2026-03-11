import CONSTANTS from './constants';

if (localStorage.getItem('token_jurassic')) {
    window.location.href = CONSTANTS.ROUTES.PANEL;
}

const formLogin = document.getElementById('form-login') as HTMLFormElement;
const formRegister = document.getElementById('form-register') as HTMLFormElement;

const alertLogin = document.getElementById('alert-login') as HTMLDivElement;
const alertRegister = document.getElementById('alert-register') as HTMLDivElement;

const mostrarAlerta = (elemento: HTMLDivElement, mensaje: string, tipo: 'success' | 'danger' | 'info') => {
    elemento.className = `alert alert-${tipo} mt-3 mb-0`;
    elemento.innerHTML = mensaje;
};

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;

        mostrarAlerta(alertLogin, 'Comprobando credenciales...', 'info');

        try {
            const url = CONSTANTS.API.BASE_URL + CONSTANTS.API.LOGIN_ENDPOINT;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            
            console.log('Respuesta del servidor al Login:', data);

            if (res.ok) {
                mostrarAlerta(alertLogin, 'Acceso concedido. Entrando al sistema...', 'success');
                
                const tokenParaGuardar = data.data.token;
                const usuarioParaGuardar = data.data; 

                if (!tokenParaGuardar || !usuarioParaGuardar) {
                    throw new Error("El servidor no devolvió el token o los datos del usuario correctamente.");
                }

                localStorage.setItem('token_jurassic', tokenParaGuardar);
                localStorage.setItem('user_jurassic', JSON.stringify(usuarioParaGuardar));

                window.location.href = CONSTANTS.ROUTES.PANEL;
            } else {
                mostrarAlerta(alertLogin, data.message || 'Credenciales incorrectas.', 'danger');
            }
        } catch (error: any) {
            console.error(error);
            mostrarAlerta(alertLogin, 'Error de conexión con el servidor principal o datos corruptos.', 'danger');
        }
    });
}

if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nick = (document.getElementById('reg-nick') as HTMLInputElement).value;
        const email = (document.getElementById('reg-email') as HTMLInputElement).value;
        const password = (document.getElementById('reg-password') as HTMLInputElement).value;
        const password_confirmation = (document.getElementById('reg-password-conf') as HTMLInputElement).value;
        const foto = (document.getElementById('reg-foto') as HTMLInputElement).files?.[0];

        if (password !== password_confirmation) {
            mostrarAlerta(alertRegister, 'Las contraseñas no coinciden.', 'danger');
            return;
        }

        mostrarAlerta(alertRegister, 'Enviando solicitud al servidor...', 'info');

        const formData = new FormData();
        formData.append('nick', nick);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('password_confirmation', password_confirmation);
        if (foto) formData.append('foto', foto);

        try {
            const url = CONSTANTS.API.BASE_URL + CONSTANTS.API.REGISTER_ENDPOINT;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                mostrarAlerta(alertRegister, '¡Registro completado! Ya puedes iniciar sesión.', 'success');
                formRegister.reset();
                
                setTimeout(() => {
                    document.getElementById('login-tab')?.click();
                    alertRegister.className = 'd-none';
                }, 1500);

            } else {
                let erroresHtml = '<ul class="mb-0 text-start">';
                for (const key in data.errores) {
                    erroresHtml += `<li>${data.errores[key][0]}</li>`;
                }
                erroresHtml += '</ul>';
                mostrarAlerta(alertRegister, erroresHtml, 'danger');
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta(alertRegister, 'Error al conectar con el servidor.', 'danger');
        }
    });
}