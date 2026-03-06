# Deploy para compartir con el equipo

Cómo obtener una URL pública para testear el proyecto sin necesidad de correrlo localmente.

**Stack de deploy:**
- **Railway** → backend NestJS + base de datos PostgreSQL
- **Vercel** → frontend Next.js

Ambos son gratuitos para proyectos pequeños y generan URLs estables del tipo:
- `https://pltform-api.railway.app`
- `https://pltform.vercel.app`

---

## Prerequisito: subir el proyecto a GitHub

Todo el proceso parte de un repositorio en GitHub. Si aún no tienen uno:

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "initial commit"

# Crear repo en github.com y luego:
git remote add origin https://github.com/tu-usuario/pltform.git
git push -u origin main
```

---

## Parte 1 — Backend en Railway

Railway despliega el backend y provisiona la base de datos PostgreSQL automáticamente.

### Paso 1: crear cuenta

Ir a **[railway.app](https://railway.app)** → Sign up with GitHub.

### Paso 2: nuevo proyecto

1. Click en **New Project**
2. Seleccionar **Deploy from GitHub repo**
3. Elegir el repositorio `pltform`
4. Railway detecta el monorepo — click en **Add service** → **GitHub Repo** nuevamente para agregar un segundo servicio (la base de datos)

### Paso 3: agregar PostgreSQL

Dentro del proyecto en Railway:

1. Click en **+ New** → **Database** → **Add PostgreSQL**
2. Railway crea la base de datos y genera automáticamente la variable `DATABASE_URL`

### Paso 4: configurar el servicio del backend

1. Click en el servicio que apunta al repo (no la base de datos)
2. Ir a la pestaña **Settings**
3. En **Root Directory** escribir: `backend`
4. En **Build Command** escribir: `npm install && npm run build`
5. En **Start Command** escribir: `node dist/main.js`

### Paso 5: variables de entorno del backend

En la pestaña **Variables** del servicio backend, agregar:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | _(copiar desde el servicio PostgreSQL → Connect → DATABASE_URL)_ |
| `JWT_SECRET` | cualquier cadena larga aleatoria, ej: `supersecreto-pltform-2025-produccion` |
| `JWT_REFRESH_SECRET` | otra cadena diferente, ej: `refresh-supersecreto-pltform-2025` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

> Railway inyecta `DATABASE_URL` automáticamente si conectas los servicios. Ve a tu servicio backend → **Variables** → **+ Add Reference** → selecciona la variable `DATABASE_URL` de PostgreSQL.

### Paso 6: ejecutar migraciones

Una vez que el primer deploy termine (tarda ~2 min), ejecutar las migraciones de Prisma desde Railway:

1. Click en el servicio backend → pestaña **Settings**
2. En la sección **Deploy** agrega esto al **Start Command** (solo la primera vez):

```
npx prisma migrate deploy && node dist/main.js
```

> Luego de que las migraciones corran exitosamente puedes dejarlo así o cambiarlo de vuelta a solo `node dist/main.js` — las migraciones son idempotentes así que no hace daño dejarlas.

### Paso 7: obtener la URL del backend

En la pestaña **Settings** del servicio backend → sección **Networking** → click en **Generate Domain**.

Anota esta URL, la necesitarás para configurar el frontend. Ejemplo:
```
https://pltform-backend-production.up.railway.app
```

---

## Parte 2 — Frontend en Vercel

### Paso 1: crear cuenta

Ir a **[vercel.com](https://vercel.com)** → Continue with GitHub.

### Paso 2: importar el proyecto

1. Click en **Add New → Project**
2. Importar el repositorio `pltform`
3. Vercel detecta que es un monorepo

### Paso 3: configurar el proyecto

En la pantalla de configuración antes de hacer deploy:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Next.js _(autodetectado)_ |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` _(por defecto)_ |
| **Install Command** | `npm install` |

### Paso 4: variables de entorno del frontend

En la sección **Environment Variables** antes de hacer deploy:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tu-backend.up.railway.app/api` _(la URL de Railway del paso anterior + `/api`)_ |

### Paso 5: deploy

Click en **Deploy**. Vercel construye y despliega el frontend (~1-2 min).

Al terminar obtienes una URL pública:
```
https://pltform.vercel.app
```

Comparte esa URL con el equipo.

---

## Verificar que todo funciona

1. Abre la URL de Vercel en el navegador
2. Registra un usuario con rol **COMPANY**
3. Registra otro usuario con rol **DEVELOPER**
4. Crea un proyecto desde la cuenta COMPANY
5. Postula desde la cuenta DEVELOPER
6. Acepta la propuesta desde COMPANY

Si todos los pasos funcionan, el deploy está completo.

---

## Actualizaciones

Cada vez que hagan `git push` a la rama `main`:

- **Vercel** redespliega el frontend automáticamente
- **Railway** redespliega el backend automáticamente

No hace falta hacer nada manual.

Para actualizar solo hay que:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## Resumen de URLs

Anota las URLs aquí una vez configurado:

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://________________.vercel.app` |
| Backend API (Railway) | `https://________________.up.railway.app/api` |
| PostgreSQL | _(interno Railway, no necesita URL pública)_ |

---

## Costos estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby (free) | $0 |
| Railway | Starter (free) | $0 — hasta $5 de uso mensual gratis |

Para un equipo pequeño testeando funcionalidades, el tier gratuito de ambos es más que suficiente.

---

## Ver también

- [deployment.md](./deployment.md) — Setup local completo para desarrollo
