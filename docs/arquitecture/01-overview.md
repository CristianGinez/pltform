# 01 — Visión General de la Arquitectura

## Tipo de sistema

Marketplace B2B de dos lados (**two-sided marketplace**):

- **Lado oferta** → `DEVELOPER`: profesionales que ofrecen servicios digitales
- **Lado demanda** → `COMPANY`: empresas que publican proyectos y contratan

---

## Capas del sistema

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│           Next.js 14 · React · Zustand           │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────┐
│                    BACKEND                       │
│              NestJS · TypeScript                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   Auth   │ │ Projects │ │    Proposals     │ │
│  │  Module  │ │  Module  │ │     Module       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Companies │ │Developers│ │    Contracts     │ │
│  │  Module  │ │  Module  │ │     Module       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ Prisma Client
┌────────────────────▼────────────────────────────┐
│                 POSTGRESQL 17                    │
│  Users · Companies · Developers · Projects       │
│  Proposals · Contracts · Milestones              │
└─────────────────────────────────────────────────┘
```

---

## Principios de diseño del schema

### 1. Un usuario, un perfil
`User` es la entidad base de autenticación. Cada usuario tiene exactamente **uno** de los dos perfiles posibles: `Company` o `Developer`. La relación es 1:1 con `onDelete: Cascade`.

```
User (auth) ──1:1──▶ Company  (perfil empresa)
             ──1:1──▶ Developer (perfil developer)
```

### 2. Separación de identidad y perfil
- `User` contiene solo datos de autenticación: `email`, `passwordHash`, `role`
- `Company` y `Developer` contienen los datos de negocio y perfil público

### 3. Inmutabilidad de rol
El `role` se asigna en el registro y no cambia. Esto simplifica la lógica de autorización mediante el `RolesGuard`.

### 4. Flujo unidireccional de estado
Todos los modelos con estado siguen una máquina de estados con transiciones unidireccionales:

```
Project:  DRAFT → OPEN → IN_PROGRESS → COMPLETED
Proposal: PENDING → ACCEPTED | REJECTED | WITHDRAWN
Contract: ACTIVE → COMPLETED | DISPUTED | CANCELLED
Milestone: PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID
```

### 5. Soft-delete vs Hard-delete
El sistema actualmente usa **hard delete** con `onDelete: Cascade` en las relaciones críticas. Las eliminaciones en cascada protegen la integridad referencial:

- Eliminar `User` → elimina `Company` o `Developer`
- Eliminar `Company` → elimina sus `Project`s
- Eliminar `Project` → elimina sus `Proposal`s
- Eliminar `Contract` → elimina sus `Milestone`s

### 6. Identificadores CUID
Todos los IDs usan `@default(cuid())`. Los CUIDs son:
- Únicos globalmente sin necesidad de coordinación
- Seguros para exponer en URLs (no secuenciales)
- Más cortos que UUID v4

---

## Módulos del backend y sus responsabilidades

| Módulo | Modelos que gestiona | Responsabilidad |
|--------|----------------------|-----------------|
| `AuthModule` | `User` | Registro, login, JWT strategy, GET /auth/me |
| `UsersModule` | `User` | Consulta de perfiles |
| `CompaniesModule` | `Company` | Directorio de empresas + PATCH /companies/me |
| `DevelopersModule` | `Developer` | Directorio + PATCH /developers/me + trabajos anteriores |
| `ProjectsModule` | `Project` | CRUD, publicar, cancelar, edición de borradores |
| `ProposalsModule` | `Proposal` | Postulaciones, aceptación y retiro |
| `ContractsModule` | `Contract`, `Milestone` | Gestión de contratos y ciclo de milestones |
| `UploadsModule` | — | Subida de imágenes de perfil (Multer, archivos estáticos) |
