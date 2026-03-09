# 02 — Modelos de Datos

Descripción detallada de cada modelo del schema de Prisma.

---

## User

Entidad base de autenticación. No contiene datos de perfil.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `email` | `String` UNIQUE | Identificador de login |
| `passwordHash` | `String?` | Hash bcrypt (nullable para OAuth futuro) |
| `role` | `Role` | Rol del usuario: COMPANY, DEVELOPER o ADMIN |
| `company` | `Company?` | Perfil empresa (si role=COMPANY) |
| `developer` | `Developer?` | Perfil developer (si role=DEVELOPER) |
| `createdAt` | `DateTime` | Fecha de registro |
| `updatedAt` | `DateTime` | Última actualización |

**Índices:** `email`

**Notas:**
- `passwordHash` es nullable para permitir OAuth en el futuro (Google, GitHub)
- Solo uno de `company` o `developer` estará poblado, nunca ambos

---

## Company

Perfil público de una empresa. Extiende a `User` con datos de negocio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `userId` | `String` UNIQUE | FK → User |
| `name` | `String` | Nombre de la empresa |
| `description` | `String?` | Descripción de la empresa |
| `industry` | `String?` | Sector (ej: Retail, Fintech, Salud) |
| `size` | `String?` | Tamaño (ej: 1-10, 11-50, 50+) |
| `website` | `String?` | URL del sitio web |
| `logoUrl` | `String?` | URL del logo |
| `location` | `String?` | Ciudad / País |
| `verified` | `Boolean` | Si fue verificada por el admin |
| `projects` | `Project[]` | Proyectos publicados |
| `createdAt` | `DateTime` | Fecha de creación |
| `updatedAt` | `DateTime` | Última actualización |

**Relaciones:**
- `User` (1:1, Cascade) — parent
- `Project` (1:N) — proyectos que ha publicado

---

## Developer

Perfil público de un desarrollador o agencia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `userId` | `String` UNIQUE | FK → User |
| `name` | `String` | Nombre completo o nombre de agencia |
| `bio` | `String?` | Descripción profesional |
| `skills` | `String[]` | Array de tecnologías / habilidades |
| `hourlyRate` | `Decimal(10,2)?` | Tarifa por hora en USD |
| `portfolioUrl` | `String?` | URL del portfolio |
| `githubUrl` | `String?` | Perfil de GitHub |
| `linkedinUrl` | `String?` | Perfil de LinkedIn |
| `location` | `String?` | Ciudad / País |
| `avatarUrl` | `String?` | URL de foto de perfil |
| `available` | `Boolean` | Disponibilidad para nuevos proyectos |
| `rating` | `Float` | Calificación promedio (0-5) |
| `reviewCount` | `Int` | Cantidad de reviews recibidas |
| `proposals` | `Proposal[]` | Propuestas enviadas |
| `createdAt` | `DateTime` | Fecha de registro |
| `updatedAt` | `DateTime` | Última actualización |

**Relaciones:**
- `User` (1:1, Cascade) — parent
- `Proposal` (1:N) — propuestas enviadas a proyectos

**Notas:**
- `rating` y `reviewCount` se actualizan cuando una empresa califica al developer tras completar un contrato (funcionalidad fase 2)
- `skills` es un array nativo de PostgreSQL (`String[]`)

---

## Project

Proyecto digital publicado por una empresa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `companyId` | `String` | FK → Company |
| `title` | `String` | Título del proyecto |
| `description` | `String` | Descripción detallada |
| `budget` | `Decimal(10,2)` | Presupuesto estimado en USD |
| `deadline` | `DateTime?` | Fecha límite de entrega |
| `skills` | `String[]` | Tecnologías requeridas |
| `category` | `String?` | Categoría (Web, Mobile, SaaS, etc.) |
| `status` | `ProjectStatus` | Estado del ciclo de vida |
| `proposals` | `Proposal[]` | Propuestas recibidas |
| `contract` | `Contract?` | Contrato activo (si IN_PROGRESS) |
| `createdAt` | `DateTime` | Fecha de creación |
| `updatedAt` | `DateTime` | Última actualización |

**Índices:** `status`, `companyId`

**Relaciones:**
- `Company` (N:1, Cascade) — empresa propietaria
- `Proposal` (1:N) — propuestas recibidas
- `Contract` (1:1?) — contrato creado al aceptar una propuesta

---

## Proposal

Postulación de un developer a un proyecto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `projectId` | `String` | FK → Project |
| `developerId` | `String` | FK → Developer |
| `coverLetter` | `String` | Carta de presentación (mín. 100 chars) |
| `budget` | `Decimal(10,2)` | Presupuesto propuesto en USD |
| `timeline` | `Int` | Días estimados para completar |
| `status` | `ProposalStatus` | Estado de la postulación |
| `createdAt` | `DateTime` | Fecha de envío |
| `updatedAt` | `DateTime` | Última actualización |

**Índices:** `projectId`, `developerId`

**Constraint único:** `[projectId, developerId]` — un developer no puede postular dos veces al mismo proyecto

**Relaciones:**
- `Project` (N:1, Cascade) — proyecto al que se postula
- `Developer` (N:1, Cascade) — developer que postula

---

## Contract

Contrato generado automáticamente cuando una empresa acepta una propuesta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `projectId` | `String` UNIQUE | FK → Project (1:1) |
| `milestones` | `Milestone[]` | Hitos del contrato |
| `status` | `ContractStatus` | Estado del contrato |
| `platformFee` | `Decimal(5,2)` | Comisión de la plataforma en % |
| `createdAt` | `DateTime` | Fecha de creación |
| `updatedAt` | `DateTime` | Última actualización |

**Relaciones:**
- `Project` (1:1) — proyecto vinculado
- `Milestone` (1:N, Cascade) — hitos de entrega

**Notas:**
- `platformFee` default es 10%. Representa el porcentaje que retiene la plataforma
- Se crea con un milestone inicial equivalente al presupuesto de la propuesta aceptada

---

## Milestone

Hito de entrega dentro de un contrato. Permite pagos parciales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (CUID) | PK |
| `contractId` | `String` | FK → Contract |
| `title` | `String` | Nombre del hito |
| `description` | `String?` | Descripción detallada |
| `amount` | `Decimal(10,2)` | Monto asignado en USD |
| `status` | `MilestoneStatus` | Estado del hito |
| `dueDate` | `DateTime?` | Fecha límite del hito |
| `order` | `Int` | Orden de entrega (1, 2, 3...) |
| `deliveryNote` | `String?` | Nota de entrega escrita por el developer |
| `deliveryLink` | `String?` | Link a staging / repo / demo al entregar |
| `startedAt` | `DateTime?` | Timestamp cuando el developer inició el milestone |
| `submittedAt` | `DateTime?` | Timestamp cuando el developer entregó el milestone |
| `createdAt` | `DateTime` | Fecha de creación |
| `updatedAt` | `DateTime` | Última actualización |

**Índices:** `contractId`

**Relaciones:**
- `Contract` (N:1, Cascade) — contrato al que pertenece
