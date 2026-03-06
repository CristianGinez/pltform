# Plan — Pltform

Marketplace B2B donde empresas publican proyectos digitales y desarrolladores postulan para ejecutarlos.

---

## Visión General

Plataforma de dos lados que conecta **empresas peruanas** con **developers** para contratar soluciones digitales (landing pages, e-commerce, sistemas de inventario, apps móviles, etc). Enfocada en negocios locales que no saben de tecnología pero necesitan digitalizarse.

---

## Estructura del Monorepo

```
pltform/
├── frontend/                  # Next.js 14 App Router
│   └── src/
│       ├── app/               # Rutas (App Router)
│       ├── components/ui/     # Navbar, DevCard, AvatarPicker
│       ├── hooks/             # use-projects, use-proposals, use-developers, use-profile, use-upload
│       ├── schemas/           # Zod schemas (project, proposal)
│       ├── lib/               # axios, avatar, query-client
│       ├── store/             # Zustand auth store
│       └── types/             # Tipos TypeScript del dominio
│
├── backend/                   # NestJS
│   └── src/
│       └── modules/
│           ├── auth/          # Registro, login, JWT
│           ├── users/         # Perfil base
│           ├── companies/     # Directorio + edición de perfil
│           ├── developers/    # Directorio + edición de perfil + trabajos anteriores
│           ├── projects/      # CRUD + ciclo de vida
│           ├── proposals/     # Postulaciones
│           ├── contracts/     # Contratos y milestones
│           └── uploads/       # Subida de imágenes de perfil
│
├── docker-compose.yml         # PostgreSQL + Redis
├── docs/                      # Documentación técnica
└── tools/scripts/             # CLI para crear usuarios
```

---

## Roles

| Rol | Descripción |
|-----|-------------|
| `COMPANY` | Empresa que publica proyectos y contrata developers |
| `DEVELOPER` | Developer individual que postula y ejecuta proyectos |
| `ADMIN` | Moderación y gestión de la plataforma |

---

## Flujo Principal

```
Empresa crea proyecto (DRAFT)
  └─▶ Publica (OPEN)
        └─▶ Developer postula (PENDING)
              └─▶ Empresa acepta propuesta
                    └─▶ Proyecto pasa a IN_PROGRESS
                    └─▶ Contrato + Milestones creados automáticamente
                          └─▶ Developer completa milestones (SUBMITTED)
                                └─▶ Empresa aprueba (APPROVED → PAID)
                                      └─▶ Proyecto COMPLETED
```

---

## Schema de Base de Datos (actual)

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String?
  role         Role
  company      Company?
  developer    Developer?
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
  hourlyRate      Decimal?
  portfolioUrl    String?
  githubUrl       String?
  linkedinUrl     String?
  location        String?
  avatarUrl       String?
  available       Boolean    @default(true)
  rating          Float      @default(0)
  reviewCount     Int        @default(0)
  university      String?
  cycle           String?
  specialtyBadges String[]
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
  budget      Decimal
  deadline    DateTime?
  skills      String[]
  category    String?
  status      ProjectStatus @default(DRAFT)
  proposals   Proposal[]
  contract    Contract?
}

model Proposal {
  id          String         @id @default(cuid())
  projectId   String
  developerId String
  coverLetter String
  budget      Decimal
  timeline    Int
  status      ProposalStatus @default(PENDING)
  @@unique([projectId, developerId])
}

model Contract {
  id          String         @id @default(cuid())
  projectId   String         @unique
  milestones  Milestone[]
  status      ContractStatus @default(ACTIVE)
  platformFee Decimal        @default(10)
}

model Milestone {
  id          String          @id @default(cuid())
  contractId  String
  title       String
  description String?
  amount      Decimal
  status      MilestoneStatus @default(PENDING)
  dueDate     DateTime?
  order       Int
}
```

---

## Páginas del Frontend (implementadas)

```
app/
├── page.tsx                        # Landing responsive
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx           # Con selección de rol
│
├── (dashboard)/
│   ├── layout.tsx                  # Sidebar desktop / bottom tabs mobile
│   └── dashboard/
│       ├── page.tsx                # Overview con métricas
│       ├── projects/
│       │   ├── page.tsx            # Lista de proyectos
│       │   ├── new/page.tsx        # Selector de paquetes + preview en tiempo real
│       │   └── [id]/page.tsx       # Detalle + propuestas + edición borrador
│       ├── proposals/page.tsx      # Mis postulaciones
│       ├── contracts/page.tsx      # Contratos activos
│       └── profile/page.tsx        # Edición inline de perfil
│
├── projects/
│   ├── page.tsx                    # Explorar proyectos (público)
│   └── [id]/page.tsx               # Detalle + formulario de postulación
│
└── developers/
    ├── page.tsx                    # Directorio público con filtros
    └── [id]/page.tsx               # Perfil estilo red social + trabajos anteriores
```

---

## Fases de Desarrollo

### Fase 1 — MVP ✅ Completado

- ✅ Setup monorepo (npm workspaces, Docker, NestJS, Next.js)
- ✅ Auth completo (registro por rol, login, JWT, guards)
- ✅ Perfiles editables: Company (descripción, industria, RUC, métodos de pago) y Developer (bio, skills, tarifa, garantía, badges, universidad)
- ✅ Avatar: subida de archivo o generación con DiceBear / gradientes
- ✅ CRUD de proyectos con selector de paquetes (landing, e-commerce, inventario, POS, app móvil)
- ✅ Vista previa en tiempo real al crear proyecto
- ✅ Edición de proyectos en estado DRAFT
- ✅ Sistema de propuestas (postular, aceptar, retirar)
- ✅ Contratos y milestones (visualización)
- ✅ Directorio público de proyectos con filtros por categoría y búsqueda
- ✅ Directorio público de developers con filtros por skill
- ✅ Perfiles públicos de developers (bio, skills, badges, trabajos anteriores)
- ✅ Dashboard diferenciado por rol (COMPANY / DEVELOPER)
- ✅ Diseño 100% responsive (mobile bottom-tabs, hamburger navbar, layouts apilables)

### Fase 2 — Monetización y Confianza 🔜

- [ ] Integración Stripe (pagos en escrow por milestone)
- [ ] Reviews y ratings tras completar proyecto (actualiza `rating` y `trustPoints`)
- [ ] Verificación de identidad de developers y empresas
- [ ] Notificaciones email (Resend) — nueva propuesta, propuesta aceptada, milestone aprobado
- [ ] Notificaciones en tiempo real (WebSockets / Socket.io)

### Fase 3 — Crecimiento 🔜

- [ ] Chat interno por contrato
- [ ] Panel Admin completo (gestión de usuarios, moderación de proyectos)
- [ ] Búsqueda full-text con PostgreSQL (proyectos y developers)
- [ ] Analytics para empresas (gasto, developers contratados, proyectos completados)
- [ ] OAuth (Google, GitHub) para registro rápido
- [ ] API pública / webhooks

---

## Stack de Infraestructura

| Capa | Desarrollo | Producción |
|------|------------|------------|
| Frontend | localhost:3000 | Vercel |
| Backend | localhost:3001 | Railway |
| Base de datos | Docker (PostgreSQL local) | Railway PostgreSQL |
| Archivos estáticos | `backend/public/uploads/` | Railway (o migrar a S3/Cloudinary en Fase 2) |
| Email | — | Resend (Fase 2) |
| Pagos | — | Stripe (Fase 2) |
