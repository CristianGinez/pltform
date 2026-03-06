# 03 — Entidades y Relaciones

---

## Diagrama completo (texto)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              USER                                    │
│  id · email · passwordHash · role · createdAt · updatedAt           │
└────────────────────┬────────────────────────────────────────────────┘
                     │ 1:1 (Cascade)
         ┌───────────┴───────────┐
         ▼                       ▼
┌────────────────┐     ┌────────────────────────────────────────────┐
│    COMPANY     │     │                 DEVELOPER                  │
│  id            │     │  id                                        │
│  userId        │     │  userId                                    │
│  name          │     │  name · bio · skills · hourlyRate          │
│  description   │     │  portfolioUrl · githubUrl · linkedinUrl    │
│  industry      │     │  location · avatarUrl                      │
│  size          │     │  available · rating · reviewCount          │
│  website       │     └──────────────────┬─────────────────────────┘
│  logoUrl       │                        │ 1:N (Cascade)
│  location      │                        ▼
│  verified      │     ┌────────────────────────────────────────────┐
└───────┬────────┘     │               PROPOSAL                     │
        │ 1:N (Cascade)│  id                                        │
        ▼              │  projectId   ─────────────────────────┐    │
┌────────────────────┐ │  developerId ◀── (Developer.id)       │    │
│      PROJECT       │ │  coverLetter · budget · timeline       │    │
│  id                │ │  status: PENDING|ACCEPTED|             │    │
│  companyId         │ │         REJECTED|WITHDRAWN             │    │
│  title             │ └────────────────────────────────────────┘    │
│  description       │                                               │
│  budget · deadline │◀──────────────────────────────────────────────┘
│  skills · category │ (projectId FK)
│  status: DRAFT|    │
│   OPEN|IN_PROGRESS │
│   COMPLETED|       │
│   CANCELLED        │
└────────┬───────────┘
         │ 1:1
         ▼
┌────────────────────────────┐
│          CONTRACT          │
│  id                        │
│  projectId (UNIQUE)        │
│  status: ACTIVE|COMPLETED  │
│         |DISPUTED|         │
│          CANCELLED         │
│  platformFee               │
└────────────┬───────────────┘
             │ 1:N (Cascade)
             ▼
┌────────────────────────────┐
│         MILESTONE          │
│  id                        │
│  contractId                │
│  title · description       │
│  amount · dueDate · order  │
│  status: PENDING|          │
│   IN_PROGRESS|SUBMITTED|   │
│   APPROVED|PAID            │
└────────────────────────────┘
```

---

## Tabla de relaciones

| Desde | Hacia | Tipo | Cardinalidad | onDelete |
|-------|-------|------|--------------|----------|
| `User` | `Company` | 1:1 | Un user tiene 0 o 1 company | Cascade |
| `User` | `Developer` | 1:1 | Un user tiene 0 o 1 developer | Cascade |
| `Company` | `Project` | 1:N | Una company tiene N proyectos | Cascade |
| `Project` | `Proposal` | 1:N | Un proyecto tiene N propuestas | Cascade |
| `Project` | `Contract` | 1:1 | Un proyecto tiene 0 o 1 contrato | — |
| `Developer` | `Proposal` | 1:N | Un developer tiene N propuestas | Cascade |
| `Contract` | `Milestone` | 1:N | Un contrato tiene N milestones | Cascade |

---

## Profundidad del grafo de relaciones

```
User (nivel 0)
  └── Company / Developer (nivel 1)
        └── Project / Proposal (nivel 2)
              └── Contract / Proposal (nivel 3)
                    └── Milestone (nivel 4)
```

El grafo tiene **4 niveles de profundidad**. Al hacer queries con `include` anidado, hay que tener en cuenta el impacto en performance para niveles > 2.

---

## Constraints de integridad

### Unicidad compuesta

```prisma
// Un developer solo puede postular UNA VEZ por proyecto
@@unique([projectId, developerId])  // en Proposal
```

### Unicidad simple

```prisma
User.email        @unique   // No se puede registrar el mismo email dos veces
User.company      (1:1)     // Un User solo puede tener una Company
User.developer    (1:1)     // Un User solo puede tener un Developer
Project.contract  (1:1)     // Un Project solo puede tener un Contract
```

---

## Dependencias de eliminación (Cascade)

Al eliminar una entidad, se eliminan en cascada:

```
DELETE User
  ├── DELETE Company
  │     └── DELETE Project[]
  │           ├── DELETE Proposal[]
  │           └── DELETE Contract
  │                 └── DELETE Milestone[]
  └── DELETE Developer
        └── DELETE Proposal[]
```

> **Atención:** Eliminar un `User` con el rol `COMPANY` elimina todos sus proyectos, contratos y milestones asociados. Esta operación es irreversible.
