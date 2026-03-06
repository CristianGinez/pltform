# INIT — Backend

NestJS con TypeScript, Prisma y PostgreSQL.

---

## Stack

| Paquete | Uso |
|---------|-----|
| `@nestjs/core` / `@nestjs/common` | Framework principal |
| `@nestjs/config` | Variables de entorno tipadas |
| `@nestjs/jwt` + `@nestjs/passport` | Autenticación JWT |
| `passport-jwt` | Estrategia JWT para Passport |
| `@prisma/client` | ORM / cliente de base de datos |
| `prisma` | CLI de migraciones y generación |
| `bcryptjs` | Hash de contraseñas |
| `class-validator` + `class-transformer` | Validación de DTOs |
| `@nestjs/swagger` | Documentación automática OpenAPI |
| `multer` + `@nestjs/platform-express` | Subida de archivos |

---

## Setup

```bash
# Desde la raíz del monorepo
npm run dev:backend

# O directamente desde la carpeta
cd backend
npm run dev
```

Crear `backend/.env`:

```env
DATABASE_URL="postgresql://pltform:pltform@localhost:5432/pltform_db"
JWT_SECRET=pltform-super-secret-jwt-key-cambia-en-produccion
JWT_REFRESH_SECRET=pltform-refresh-secret-diferente-cambia-en-produccion
PORT=3001
NODE_ENV=development
```

---

## Estructura de carpetas

```
backend/src/
├── main.ts                        # Bootstrap: CORS, ValidationPipe, Swagger, static files
├── app.module.ts                  # Módulo raíz — importa todos los módulos
│
├── config/
│   └── configuration.ts           # Config tipada
│
├── prisma/
│   ├── prisma.service.ts          # PrismaClient como servicio inyectable
│   └── prisma.module.ts           # Módulo global (@Global)
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      # Protege rutas con JWT
│   │   └── roles.guard.ts         # Verifica roles (COMPANY, DEVELOPER, ADMIN)
│   └── decorators/
│       ├── roles.decorator.ts     # @Roles('COMPANY')
│       └── current-user.decorator.ts  # @CurrentUser()
│
└── modules/
    ├── auth/                      # Registro, login, JWT strategy, GET /auth/me
    ├── users/                     # Consulta de perfiles
    ├── companies/                 # Directorio + PATCH /companies/me
    ├── developers/                # Directorio + PATCH /developers/me (con trabajos anteriores)
    ├── projects/                  # CRUD + publicar + cancelar
    ├── proposals/                 # Postulaciones + aceptar/retirar
    ├── contracts/                 # Contratos y milestones
    └── uploads/                   # Subida de imágenes (POST /uploads)
```

Los archivos subidos se sirven como estáticos desde `backend/public/uploads/`.

---

## Endpoints disponibles

### Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | — | Registrar usuario (crea User + Company o Developer) |
| POST | `/login` | — | Iniciar sesión → retorna `access_token` |
| GET | `/me` | JWT | Devuelve User con Company o Developer completo |

### Projects — `/api/projects`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | — | Listar proyectos públicos (`?status=OPEN`) |
| GET | `/my` | COMPANY | Mis proyectos |
| GET | `/:id` | — | Detalle de proyecto con propuestas |
| POST | `/` | COMPANY | Crear proyecto (estado inicial: DRAFT) |
| PATCH | `/:id` | COMPANY | Editar proyecto (solo en estado DRAFT) |
| PATCH | `/:id/publish` | COMPANY | Publicar (DRAFT → OPEN) |
| PATCH | `/:id/cancel` | COMPANY | Cancelar proyecto |

### Proposals — `/api/proposals`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/my` | DEVELOPER | Mis propuestas enviadas |
| POST | `/project/:projectId` | DEVELOPER | Postular a un proyecto |
| PATCH | `/:id/accept` | COMPANY | Aceptar propuesta (crea Contrato + Milestones) |
| PATCH | `/:id/withdraw` | DEVELOPER | Retirar propuesta propia |

### Contracts — `/api/contracts`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/:id` | JWT | Ver contrato con milestones |
| PATCH | `/:id/milestones/:milestoneId/submit` | DEVELOPER | Entregar milestone |
| PATCH | `/:id/milestones/:milestoneId/approve` | COMPANY | Aprobar milestone |

### Companies — `/api/companies`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | — | Listar empresas |
| PATCH | `/me` | COMPANY | Actualizar perfil de empresa |
| GET | `/:id` | — | Detalle de empresa |

### Developers — `/api/developers`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | — | Listar developers (`?skill=React`) |
| PATCH | `/me` | DEVELOPER | Actualizar perfil de developer |
| GET | `/:id` | — | Perfil público de developer (incluye trabajos anteriores) |

### Uploads — `/api/uploads`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | JWT | Subir imagen de perfil → retorna `{ url: "/uploads/filename.ext" }` |

Las imágenes se sirven desde `http://localhost:3001/uploads/filename.ext`.

---

## Autenticación

### Flujo de registro

```
POST /api/auth/register
  body: { email, password, role, name }
  └─▶ Verifica email único
        └─▶ Hash de password (bcrypt, salt=10)
              └─▶ Crea User + Company o Developer
                    └─▶ Retorna { access_token, user }
```

### Flujo de login

```
POST /api/auth/login
  body: { email, password }
  └─▶ Busca user por email
        └─▶ Compara password con bcrypt
              └─▶ Retorna { access_token, user }
```

### Proteger un endpoint

```typescript
@UseGuards(JwtAuthGuard)               // Solo token válido
@UseGuards(JwtAuthGuard, RolesGuard)   // Token + rol específico
@Roles('COMPANY')                      // Solo empresas
@CurrentUser() user: User              // Inyecta el usuario autenticado
```

---

## Schema de Prisma (modelos actuales)

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String?
  role         Role       // COMPANY | DEVELOPER | ADMIN
  company      Company?
  developer    Developer?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  @@index([email])
}

model Company {
  id                String    @id @default(cuid())
  userId            String    @unique
  name              String
  description       String?
  industry          String?
  size              String?
  website           String?
  logoUrl           String?
  location          String?
  verified          Boolean   @default(false)
  ruc               String?
  contactPerson     String?
  painDescription   String?
  paymentMethods    String[]
  clientRating      Float     @default(0)
  clientReviewCount Int       @default(0)
  projects          Project[]
}

model Developer {
  id              String     @id @default(cuid())
  userId          String     @unique
  name            String
  bio             String?
  skills          String[]
  hourlyRate      Decimal?   @db.Decimal(10, 2)
  portfolioUrl    String?
  githubUrl       String?
  linkedinUrl     String?
  location        String?
  avatarUrl       String?    // URL de imagen o "gradient:from-X:to-Y"
  available       Boolean    @default(true)
  rating          Float      @default(0)
  reviewCount     Int        @default(0)
  university      String?
  cycle           String?
  specialtyBadges String[]   // ["inventarios", "pagos", "emergencias", ...]
  trustPoints     Int        @default(0)
  verified        Boolean    @default(false)
  ruc             String?
  warrantyDays    Int?
  proposals       Proposal[]
}

model Project {
  id          String        @id @default(cuid())
  companyId   String
  title       String
  description String
  budget      Decimal       @db.Decimal(10, 2)
  deadline    DateTime?
  skills      String[]
  category    String?
  status      ProjectStatus @default(DRAFT)
  proposals   Proposal[]
  contract    Contract?
  @@index([status])
  @@index([companyId])
}

model Proposal {
  id          String         @id @default(cuid())
  projectId   String
  developerId String
  coverLetter String
  budget      Decimal        @db.Decimal(10, 2)
  timeline    Int            // días estimados
  status      ProposalStatus @default(PENDING)
  @@unique([projectId, developerId])
}

model Contract {
  id          String         @id @default(cuid())
  projectId   String         @unique
  milestones  Milestone[]
  status      ContractStatus @default(ACTIVE)
  platformFee Decimal        @default(10) @db.Decimal(5, 2)
}

model Milestone {
  id          String          @id @default(cuid())
  contractId  String
  title       String
  description String?
  amount      Decimal         @db.Decimal(10, 2)
  status      MilestoneStatus @default(PENDING)
  dueDate     DateTime?
  order       Int
  @@index([contractId])
}
```

---

## Enums

| Enum | Valores |
|------|---------|
| `Role` | `COMPANY`, `DEVELOPER`, `ADMIN` |
| `ProjectStatus` | `DRAFT`, `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `ProposalStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `ContractStatus` | `ACTIVE`, `COMPLETED`, `DISPUTED`, `CANCELLED` |
| `MilestoneStatus` | `PENDING`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `PAID` |

---

## Comandos de base de datos

```bash
# Crear nueva migración
cd backend
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy

# Regenerar cliente (después de cambiar schema.prisma)
npx prisma generate

# Abrir Prisma Studio (GUI visual)
npx prisma studio
```

---

## Scripts

```bash
npm run dev         # Servidor en modo watch (hot reload)
npm run build       # Compilar TypeScript a dist/
npm run start       # Iniciar servidor compilado
npm run db:migrate  # Correr migraciones pendientes
npm run db:generate # Regenerar Prisma Client
npm run db:studio   # Abrir Prisma Studio
```

---

## Solución de problemas

### `Cannot find module 'dist/main'`
El build está corrupto o no existe. Limpiar y recompilar:
```bash
cd backend
rm -rf dist tsconfig.build.tsbuildinfo
npm run build
```

### Migraciones después de `git pull`
Si hay cambios en `prisma/schema.prisma`:
```bash
npm run db:migrate
npm run db:generate
```
