if (!localStorage.getItem('token_jurassic')) {
    window.location.href = '/';
}

const inputEmail = document.getElementById('email') as HTMLInputElement;
const inputRol = document.getElementById('rol') as HTMLInputElement;
const inputNick = document.getElementById('nick') as HTMLInputElement;
const imgPreview = document.getElementById('img-preview') as HTMLImageElement;
const btnLogout = document.getElementById('btn-logout') as HTMLButtonElement;

const form = document.getElementById('form-perfil') as HTMLFormElement;
const alertError = document.getElementById('alert-error') as HTMLDivElement;
const alertSuccess = document.getElementById('alert-success') as HTMLDivElement;

const userString = localStorage.getItem('user_jurassic');
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
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('token_jurassic');
        localStorage.removeItem('user_jurassic');
        window.location.href = '/';
    });
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        alertError.classList.add('d-none');
        alertSuccess.classList.add('d-none');

        const nuevoNick = inputNick.value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const passwordConfirm = (document.getElementById('password_confirmation') as HTMLInputElement).value;
        const fotoFile = (document.getElementById('foto') as HTMLInputElement).files?.[0];

        if (password && password !== passwordConfirm) {
            alertError.classList.remove('d-none');
            alertError.innerText = 'Las contraseñas no coinciden.';
            return;
        }

        alertSuccess.classList.remove('d-none');
        alertSuccess.classList.replace('alert-success', 'alert-info');
        alertSuccess.innerText = 'Preparando datos para enviar a Laravel... (Falta backend)';

    });
}