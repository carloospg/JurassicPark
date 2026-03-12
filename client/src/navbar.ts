import CONSTANTS from './constants';


export function initNavbar(paginaActiva: 'panel' | 'personal') {
    const token      = localStorage.getItem('token_jurassic');
    const userString = localStorage.getItem('user_jurassic');

    // Guardia de ruta: si no hay sesion redirigimos al login
    if (!token || !userString) {
        window.location.href = '/';
        return;
    }

    const usuario = JSON.parse(userString);
    
    const linkPersonal = usuario.rol === 'Administrador' ? `
        <li class="nav-item">
            <a class="nav-link ${paginaActiva === 'personal' ? 'active' : ''}" href="/src/usuarios/usuarios.html">
                <i class="bi bi-people-fill me-1"></i> Personal
            </a>
        </li>
    ` : '';

    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid px-4">
                <a class="navbar-brand fw-bold" href="/src/panel/panel.html">
                    <i class="bi bi-bug-fill text-warning me-2"></i>Jurassic Park
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link ${paginaActiva === 'panel' ? 'active' : ''}" href="/src/panel/panel.html">
                                <i class="bi bi-grid-1x2-fill me-1"></i> Panel
                            </a>
                        </li>
                        ${linkPersonal}
                    </ul>
                    <div class="d-flex align-items-center">
                        <img id="nav-user-foto" src="" alt="Foto" class="rounded-circle me-2 object-fit-cover border border-secondary nav-user-foto">
                        <div class="dropdown">
                            <button class="btn btn-dark dropdown-toggle border-0 fw-bold" type="button" id="nav-user-name" data-bs-toggle="dropdown">
                                ${usuario.nick}
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li><a class="dropdown-item py-2" href="/src/perfil/perfil.html"><i class="bi bi-person-badge me-2 text-primary"></i>Ver Perfil</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item py-2 text-danger fw-bold" id="btn-logout-nav"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesion</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Inyectamos el navbar en el contenedor del HTML
    const contenedor = document.getElementById('navbar-container');
    if (contenedor) contenedor.innerHTML = navbarHTML;

    // Ponemos la foto si existe
    const navUserFoto = document.getElementById('nav-user-foto') as HTMLImageElement;
    if (navUserFoto && usuario.foto) {
        navUserFoto.src = usuario.foto;
        navUserFoto.style.display = 'block';
    }

    // Evento de cerrar sesion
    document.getElementById('btn-logout-nav')?.addEventListener('click', () => {
        localStorage.removeItem('token_jurassic');
        localStorage.removeItem('user_jurassic');
        window.location.href = CONSTANTS.ROUTES.INDEX;
    });
}