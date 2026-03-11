import CONSTANTS from '../constants';

// 1. GUARDIA DE RUTA
if (!localStorage.getItem('token_jurassic')) {
    window.location.href = '/';
}

// 2. CARGAR DATOS DEL USUARIO EN LA BARRA (NAVBAR)
const userString = localStorage.getItem('user_jurassic');
if (userString) {
    const user = JSON.parse(userString);
    
    const navUserName = document.getElementById('nav-user-name');
    const navUserFoto = document.getElementById('nav-user-foto') as HTMLImageElement;

    if (navUserName) {
        navUserName.innerText = user.nick;
    }
    
    if (navUserFoto && user.foto) {
        navUserFoto.src = user.foto;
        navUserFoto.style.display = 'block';
    }

    // 3. OCULTAR ENLACE DE PERSONAL SI NO ES ADMIN
    if (user.rol !== 'Administrador') {
        document.getElementById('link-personal')?.remove();
    }
}

// 4. BOTÓN CERRAR SESIÓN
const btnLogoutNav = document.getElementById('btn-logout-nav');
if (btnLogoutNav) {
    btnLogoutNav.addEventListener('click', () => {
        localStorage.removeItem('token_jurassic');
        localStorage.removeItem('user_jurassic');
        window.location.href = CONSTANTS.ROUTES.INDEX;
    });
}