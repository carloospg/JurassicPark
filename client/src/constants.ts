const CONSTANTS = {
    API: {
        BASE_URL: 'http://127.0.0.1:8000/api/',
        REGISTER_ENDPOINT: 'registro',
        LOGIN_ENDPOINT: 'login',
        PROFILE_UPDATE: 'perfil/actualizar',
        USERS: 'usuarios',
        CELDAS: 'celdas',
        DINOSAURIOS: 'dinosaurios',
        ESPECIES: 'especies'
    },
    APP: {
        NAME: 'Jurassic Park',
        USER_DEFAULT_AVATAR: 'https://res.cloudinary.com/dgznikiob/image/upload/v1772707938/fotoperfil_hmislm.png',
    },
    ROUTES: {
        INDEX: '/',
        PANEL: '/src/panel/panel.html',
        PROFILE: '/src/perfil/perfil.html',
        USERS: '/src/usuarios/usuarios.html',
        DINOSAURIOS: '/src/dinosaurios/dinosaurios.html',
    }
};

export default CONSTANTS;