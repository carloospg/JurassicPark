# 🦕 Jurassic Park — Sistema de Gestión del Parque

Proyecto de simulación y gestión para el parque Jurassic Park, desarrollado como desafío de recuperación de la primera evaluación de 2º CFGS DAW en el CIFP Virgen de Gracia.

---

## Tecnologías utilizadas

**Back-end:**
- Laravel 11
- JWT Auth (php-open-source-saver/jwt-auth)
- Laravel Reverb (WebSockets)
- Cloudinary (gestión de imágenes)
- MySQL
- Eloquent ORM

**Front-end:**
- Vanilla TypeScript + Vite
- Bootstrap 5
- Laravel Echo + Pusher JS

---

## Instalación

### 1. Clonar el repositorio

```bash
https://github.com/carloospg/JurassicPark
```

### 2. Configurar el Back-end

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
```

Edita el archivo `.env` y configura la base de datos:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=jurassicpark
DB_USERNAME=root
DB_PASSWORD=
```

Asegúrate de que también tienes estas variables configuradas:

```
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database

REVERB_APP_ID=568814
REVERB_APP_KEY=dk1kw8wzg4whrv3inuv5
REVERB_APP_SECRET=pterb2kpmtbqkpdylxmn
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
```

Ejecuta las migraciones y seeders:

```bash
php artisan migrate:fresh --seed
```

### 3. Configurar el Front-end

```bash
cd ../client
npm install
```

---

## Arrancar el proyecto

Necesitas **4 terminales** abiertas simultáneamente:

**Terminal 1 — Servidor Laravel:**
```bash
cd server
php artisan serve
```

**Terminal 2 — Servidor WebSockets (Reverb):**
```bash
cd server
php artisan reverb:start
```

**Terminal 3 — Worker de colas:**
```bash
cd server
php artisan queue:work
```

**Terminal 4 — Cliente Vite:**
```bash
cd client
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Credenciales de acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@jurassicpark.com | admin |
| Veterinario | usuario1@jurassic.com | usuario1 |

---

## Funcionalidades por rol

### Administrador
- Gestión completa de usuarios (crear, editar rol, dar de baja)
- Gestión completa de celdas (crear, editar, eliminar)
- Gestión completa de dinosaurios (crear, editar, eliminar)
- Gestión completa de tareas (crear, asignar empleados, cambiar estado, eliminar)
- Lanzar simulación normal (baja alimento, genera averías y tareas automáticas)
- Lanzar simulación de brecha (calcula probabilidad de fuga por celda)
- Recibe notificaciones en tiempo real de tareas y simulaciones

### Veterinario / Mantenimiento
- Ver sus tareas asignadas
- Avanzar el estado de sus tareas (Pendiente → En progreso → Finalizada)
- Ver el detalle de la celda asociada a cada tarea
- Recibe notificaciones en tiempo real cuando se le asigna o actualiza una tarea
- Editar su perfil (foto y contraseña)

---

## Tests

Para ejecutar todos los tests:

```bash
cd server
php artisan test
```

Para ejecutar un grupo concreto:

```bash
php artisan test --filter=TareaTest
php artisan test --filter=SimulacionBrechaTest
php artisan test --filter=SimulacionNormalTest
```