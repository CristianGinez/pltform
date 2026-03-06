# Guía de Deployment — Pltform

Guía paso a paso para que cualquier miembro del equipo levante el proyecto en su máquina o lo despliegue a producción.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Setup inicial (primera vez)](#2-setup-inicial-primera-vez)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Base de datos](#4-base-de-datos)
5. [Ejecutar en desarrollo](#5-ejecutar-en-desarrollo)
6. [Build de producción](#6-build-de-producción)
7. [Crear usuarios de prueba](#7-crear-usuarios-de-prueba)
8. [Despliegue en servidor](#8-despliegue-en-servidor)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## 1. Requisitos previos

Instala estas herramientas antes de comenzar:

| Herramienta | Versión mínima | Verificar |
|-------------|----------------|-----------|
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| Git | cualquiera | `git --version` |
| Docker Desktop | cualquiera | `docker -v` _(opcional, para la BD)_ |

> Si no tienes PostgreSQL instalado localmente, usa Docker (ver sección 4).

---

## 2. Setup inicial (primera vez)

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd pltform

# 2. Instalar todas las dependencias del monorepo (frontend + backend)
npm install
```

> `npm install` en la raíz instala las dependencias de ambos workspaces automáticamente gracias a npm workspaces.

---

## 3. Variables de entorno

### Backend (`backend/.env`)

Crea el archivo `backend/.env` con el siguiente contenido:

```env
# Base de datos
DATABASE_URL="postgresql://pltform:pltform@localhost:5432/pltform_db"

# JWT — usa cadenas largas y aleatorias (min. 32 caracteres)
JWT_SECRET=cambia-esto-por-una-clave-secreta-larga-aleatoria
JWT_REFRESH_SECRET=cambia-esto-por-otra-clave-diferente-aleatoria

# Puerto del servidor (opcional, por defecto 3001)
PORT=3001
```

> **Importante:** si usas tus propias credenciales de PostgreSQL, ajusta `DATABASE_URL` en consecuencia.

### Frontend (`frontend/.env.local`)

Crea el archivo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> En producción cambia esta URL por la dirección de tu servidor backend.

---

## 4. Base de datos

### Opción A — Docker (recomendado para desarrollo)

Levanta PostgreSQL y Redis con un solo comando:

```bash
docker-compose up -d
```

Esto inicia:
- **PostgreSQL 16** en `localhost:5432`
  - Usuario: `pltform` / Contraseña: `pltform` / BD: `pltform_db`
- **Redis 7** en `localhost:6379`

Para detener los servicios:

```bash
docker-compose down
```

Para detener y **borrar todos los datos**:

```bash
docker-compose down -v
```

### Opción B — PostgreSQL local

Si ya tienes PostgreSQL instalado, crea la base de datos manualmente:

```sql
CREATE USER pltform WITH PASSWORD 'pltform';
CREATE DATABASE pltform_db OWNER pltform;
```

Luego ajusta `DATABASE_URL` en `backend/.env`.

### Aplicar migraciones

Una vez que la base de datos esté corriendo, ejecuta las migraciones:

```bash
npm run db:migrate
```

Esto crea todas las tablas. Es necesario ejecutarlo:
- La primera vez que clonas el proyecto
- Cada vez que un compañero agrega una migración nueva (`git pull` + `npm run db:migrate`)

---

## 5. Ejecutar en desarrollo

### Ambos servicios en paralelo (recomendado)

```bash
npm run dev
```

Esto levanta frontend y backend simultáneamente.

### Por separado

```bash
# Solo backend (NestJS, puerto 3001)
npm run dev:backend

# Solo frontend (Next.js, puerto 3000)
npm run dev:frontend
```

### URLs disponibles

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Prisma Studio (GUI de BD) | http://localhost:5555 |

Para abrir Prisma Studio:

```bash
npm run db:studio
```

---

## 6. Build de producción

```bash
# Build completo (backend + frontend)
npm run build
```

O por separado:

```bash
npm run build:backend    # Compila NestJS → dist/
npm run build:frontend   # Compila Next.js → .next/
```

### Ejecutar en producción

```bash
# Backend
cd backend && node dist/main.js

# Frontend (en otra terminal o servidor)
cd frontend && npm start
```

> Asegúrate de que las variables de entorno de producción estén configuradas antes de ejecutar.

---

## 7. Crear usuarios de prueba

El proyecto incluye un script CLI para crear usuarios sin registro manual:

```bash
npm run users:create
```

El script te pedirá email, contraseña y rol (`COMPANY` o `DEVELOPER`).

**Usuarios sugeridos para pruebas:**

| Email | Contraseña | Rol |
|-------|------------|-----|
| empresa@test.com | Test1234! | COMPANY |
| dev@test.com | Test1234! | DEVELOPER |

> Crea al menos un usuario de cada rol para probar el flujo completo.

---

## 8. Despliegue en servidor

### Requisitos del servidor

- Node.js 18+
- PostgreSQL 16+ (o acceso a una instancia externa)
- Acceso a puertos 3000 (frontend) y 3001 (backend)

### Pasos

```bash
# 1. Clonar en el servidor
git clone <url-del-repositorio> /opt/pltform
cd /opt/pltform

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno de producción
#    Crea backend/.env y frontend/.env.local con valores de producción

# 4. Aplicar migraciones
npm run db:migrate

# 5. Build
npm run build

# 6. Iniciar backend
cd backend && node dist/main.js &

# 7. Iniciar frontend
cd ../frontend && npm start &
```

### Con PM2 (recomendado para producción)

```bash
npm install -g pm2

# Backend
pm2 start backend/dist/main.js --name pltform-api

# Frontend
pm2 start "npm start" --name pltform-web --cwd frontend

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

### Variables de entorno de producción

```env
# backend/.env (producción)
DATABASE_URL="postgresql://usuario:password@host:5432/pltform_db"
JWT_SECRET=<cadena-aleatoria-min-64-chars>
JWT_REFRESH_SECRET=<cadena-aleatoria-diferente-min-64-chars>
PORT=3001
NODE_ENV=production
```

```env
# frontend/.env.local (producción)
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
```

---

## 9. Solución de problemas comunes

### `Cannot find module 'dist/main'` al iniciar el backend

El backend no está compilado o la compilación anterior quedó corrupta.

```bash
cd backend
rm -rf dist tsconfig.build.tsbuildinfo
cd ..
npm run build:backend
```

### `ECONNREFUSED` o `Can't reach database server`

La base de datos no está corriendo.

```bash
# Verificar que Docker esté activo
docker ps

# Si el contenedor no aparece, levantarlo
docker-compose up -d

# Verificar que PostgreSQL responde
docker exec pltform_postgres pg_isready -U pltform
```

### `Prisma Client is not generated`

Falta generar el cliente de Prisma después de clonar o después de un cambio en `schema.prisma`.

```bash
npm run db:generate
```

### El frontend siempre redirige a `/login`

Verifica que `NEXT_PUBLIC_API_URL` en `frontend/.env.local` apunte al backend correcto y que el backend esté corriendo.

### Puerto en uso (`EADDRINUSE`)

```bash
# Encontrar qué proceso usa el puerto (ej: 3001)
netstat -ano | findstr :3001        # Windows
lsof -i :3001                       # macOS/Linux

# Terminar el proceso (reemplaza PID con el número encontrado)
taskkill /PID <PID> /F              # Windows
kill -9 <PID>                       # macOS/Linux
```

### Migraciones pendientes después de `git pull`

Siempre ejecuta esto tras hacer pull si hay cambios en `backend/prisma/`:

```bash
npm run db:migrate
npm run db:generate
```

---

## Flujo de trabajo en equipo

```
git pull
npm install          ← solo si cambiaron package.json
npm run db:migrate   ← solo si hay migraciones nuevas
npm run dev
```

> Ante cualquier duda, revisa los logs del backend en la terminal donde corre `npm run dev:backend`.
