# INIT — Pltform

Plataforma B2B que conecta empresas con desarrolladores de software para contratar soluciones digitales.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, NestJS, TypeScript |
| Base de datos | PostgreSQL 16, Prisma ORM 5 |
| Estado cliente | Zustand (auth), TanStack Query v5 (server state) |
| Formularios | React Hook Form + Zod |
| Auth | JWT (access token), bcryptjs |
| Monorepo | npm workspaces |

---

## Estructura del monorepo

```
pltform/
├── frontend/                  # Next.js 14 App Router
├── backend/                   # NestJS API REST
├── docs/
│   ├── INIT.md                # Este archivo — punto de entrada
│   ├── INIT-FRONTEND.md       # Guía técnica del frontend
│   ├── INIT-BACKEND.md        # Guía técnica del backend
│   ├── PLAN.md                # Plan de producto y fases
│   ├── arquitecture/          # Documentación de arquitectura técnica
│   ├── decisions/             # ADRs — Architecture Decision Records
│   └── runbooks/
│       ├── deployment.md      # Setup local completo
│       └── deploy-preview.md  # Deploy a Railway + Vercel (URL pública)
├── tools/
│   └── scripts/
│       └── create-user.js     # CLI para crear usuarios sin registro
├── docker-compose.yml         # PostgreSQL + Redis para desarrollo local
├── package.json               # Workspace root
└── tsconfig.base.json
```

---

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- **Docker Desktop** (para la base de datos local)
- **Git**

---

## Setup inicial (primera vez)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/CristianGinez/pltform.git
cd pltform
npm install
```

### 2. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Levanta PostgreSQL en `localhost:5432`:
- Usuario: `pltform` / Contraseña: `pltform` / BD: `pltform_db`

### 3. Variables de entorno

**`backend/.env`:**
```env
DATABASE_URL="postgresql://pltform:pltform@localhost:5432/pltform_db"
JWT_SECRET=pltform-super-secret-jwt-key-cambia-en-produccion
JWT_REFRESH_SECRET=pltform-refresh-secret-diferente-cambia-en-produccion
PORT=3001
NODE_ENV=development
```

**`frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Migraciones y cliente Prisma

```bash
npm run db:migrate
npm run db:generate
```

### 5. (Opcional) Crear usuarios de prueba

```bash
npm run users:create
```

---

## Comandos principales

```bash
# Levantar todo en paralelo
npm run dev

# Por separado
npm run dev:frontend    # http://localhost:3000
npm run dev:backend     # http://localhost:3001

# Base de datos
npm run db:migrate      # Aplicar migraciones pendientes
npm run db:generate     # Regenerar cliente Prisma
npm run db:studio       # Abrir Prisma Studio (GUI visual de la BD)

# Build de producción
npm run build
```

---

## URLs en desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Prisma Studio | http://localhost:5555 |

---

## Flujo principal

```
Empresa se registra → completa perfil
  └─▶ Crea proyecto (DRAFT)
        └─▶ Publica proyecto (OPEN)
              └─▶ Developers postulan con carta + presupuesto
                    └─▶ Empresa acepta una propuesta
                          └─▶ Proyecto pasa a IN_PROGRESS
                                └─▶ Contrato + Milestones creados
                                      └─▶ Developer completa milestones
                                            └─▶ Empresa aprueba → COMPLETED
```

---

## Roles

| Rol | Acciones |
|-----|----------|
| `COMPANY` | Crear/publicar proyectos, recibir propuestas, aceptar developers, gestionar contratos, editar perfil |
| `DEVELOPER` | Explorar proyectos, postular, gestionar propuestas y contratos, editar perfil público, subir avatar |
| `ADMIN` | Gestión y moderación (acceso por script CLI) |

---

## Estado de implementación

### ✅ Implementado (MVP)
- Autenticación completa (registro, login, JWT)
- Perfiles COMPANY y DEVELOPER con edición inline
- Subida de avatar (archivo subido o generado con DiceBear)
- CRUD de proyectos con selector de paquetes y vista previa en tiempo real
- Sistema de propuestas (postular, aceptar, retirar)
- Contratos y milestones (visualización)
- Directorio público de proyectos y developers con filtros
- Perfiles públicos de developers (estilo red social con trabajos anteriores)
- Dashboard responsive con navegación por rol
- Diseño completamente responsive (mobile bottom-tabs + desktop sidebar)

### 🔜 Próximas fases
- Pagos con Stripe (escrow por milestone)
- Notificaciones en tiempo real (WebSockets)
- Reviews y ratings tras completar proyecto
- Panel Admin completo
- Chat interno por contrato

---

## Ver también

- [INIT-FRONTEND.md](./INIT-FRONTEND.md) — Estructura y guía del frontend
- [INIT-BACKEND.md](./INIT-BACKEND.md) — Endpoints, módulos y guía del backend
- [runbooks/deployment.md](./runbooks/deployment.md) — Setup local detallado
- [runbooks/deploy-preview.md](./runbooks/deploy-preview.md) — Deploy a Railway + Vercel
