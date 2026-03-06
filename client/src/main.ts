import './style.css';

const panelBotones = document.getElementById('panel-botones') as HTMLDivElement;

const token = localStorage.getItem('token_jurassic');
const userString = localStorage.getItem('user_jurassic');

const renderizarInterfaz = () => {
    if (!panelBotones) return;

    if (token && userString) {
        const user = JSON.parse(userString);

        panelBotones.innerHTML = `
            <div class="alert alert-success mb-3 p-2 text-center" role="alert">
                Bienvenido/a de vuelta, <strong>${user.nick}</strong>
            </div>
            
            <a href="/src/perfil/perfil.html" class="btn btn-primary btn-lg fw-bold shadow-sm mb-2">
                <i class="bi bi-person-badge me-2"></i> Mi Perfil
            </a>
            
            <button id="btn-logout" class="btn btn-danger btn-lg fw-bold shadow-sm">
                <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesion
            </button>
        `;

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                localStorage.removeItem('token_jurassic');
                localStorage.removeItem('user_jurassic');
                
                window.location.reload();
            });
        }

    } else {
        panelBotones.innerHTML = `
            <a href="/src/login/login.html" class="btn btn-dark btn-lg fw-bold shadow-sm mb-2">
                <i class="bi bi-box-arrow-in-right me-2"></i> Iniciar Sesion
            </a>
            
            <a href="/src/registro/registro.html" class="btn btn-success btn-lg fw-bold shadow-sm">
                <i class="bi bi-person-plus-fill me-2"></i> Registrarse
            </a>
        `;
    }
};

renderizarInterfaz();