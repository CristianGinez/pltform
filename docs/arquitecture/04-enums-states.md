# 04 — Enums y Máquinas de Estado

---

## Enum: Role

Define el tipo de usuario en el sistema.

| Valor | Descripción | Puede hacer |
|-------|-------------|-------------|
| `COMPANY` | Empresa o negocio | Crear proyectos, ver propuestas, aceptar developers, gestionar contratos |
| `DEVELOPER` | Desarrollador o agencia | Explorar proyectos, postular, gestionar contratos y milestones |
| `ADMIN` | Administrador de la plataforma | Verificar empresas, moderar, gestión general |

**Regla:** El rol se asigna en el registro y **no puede cambiarse**.

---

## Máquina de estados: ProjectStatus

Ciclo de vida de un proyecto desde su creación hasta su cierre.

```
                    ┌──────────┐
                    │  DRAFT   │  ← Estado inicial al crear
                    └────┬─────┘
                         │ publish()  [COMPANY]
                         ▼
                    ┌──────────┐
              ┌────▶│   OPEN   │  ← Acepta postulaciones
              │     └────┬─────┘
              │          │ accept proposal  [COMPANY]
              │          ▼
              │     ┌─────────────┐
              │     │ IN_PROGRESS │  ← Contrato activo
              │     └─────┬───────┘
              │           │ all milestones PAID
              │           ▼
              │     ┌───────────┐
              │     │ COMPLETED │  ← Proyecto finalizado
              │     └───────────┘
              │
              │  cancel()  [COMPANY]
              └─────── CANCELLED ←─── desde DRAFT u OPEN
```

| Transición | Acción | Actor |
|------------|--------|-------|
| `DRAFT → OPEN` | Publicar proyecto | COMPANY |
| `OPEN → IN_PROGRESS` | Aceptar una propuesta | COMPANY |
| `IN_PROGRESS → COMPLETED` | Todos los milestones pagados | Sistema |
| `DRAFT → CANCELLED` | Cancelar antes de publicar | COMPANY |
| `OPEN → CANCELLED` | Cancelar proyecto abierto | COMPANY |

---

## Máquina de estados: ProposalStatus

Ciclo de vida de una postulación.

```
                    ┌─────────┐
                    │ PENDING │  ← Estado inicial al postular
                    └────┬────┘
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
      ┌──────────┐ ┌──────────┐ ┌───────────┐
      │ ACCEPTED │ │ REJECTED │ │ WITHDRAWN │
      └──────────┘ └──────────┘ └───────────┘
    [COMPANY]       [COMPANY]    [DEVELOPER]
```

| Transición | Acción | Actor | Efecto secundario |
|------------|--------|-------|-------------------|
| `PENDING → ACCEPTED` | Aceptar propuesta | COMPANY | Rechaza las demás; crea Contract; Project → IN_PROGRESS |
| `PENDING → REJECTED` | Rechazar propuesta | COMPANY | — |
| `PENDING → WITHDRAWN` | Retirar postulación | DEVELOPER | — |

**Regla importante:** Cuando una propuesta pasa a `ACCEPTED`, todas las demás propuestas del mismo proyecto pasan automáticamente a `REJECTED`.

---

## Máquina de estados: ContractStatus

Ciclo de vida de un contrato.

```
              ┌────────┐
              │ ACTIVE │  ← Creado al aceptar propuesta
              └───┬────┘
        ┌─────────┼─────────┐
        ▼         ▼         ▼
  ┌───────────┐ ┌──────────┐ ┌───────────┐
  │ COMPLETED │ │ DISPUTED │ │ CANCELLED │
  └───────────┘ └──────────┘ └───────────┘
```

| Estado | Descripción |
|--------|-------------|
| `ACTIVE` | Contrato vigente, milestones en progreso |
| `COMPLETED` | Todos los milestones aprobados y pagados |
| `DISPUTED` | Existe una disputa entre las partes |
| `CANCELLED` | Contrato rescindido |

---

## Máquina de estados: MilestoneStatus

Ciclo de vida de un hito de entrega.

```
           ┌─────────┐
           │ PENDING │  ← Estado inicial
           └────┬────┘
                │ developer inicia trabajo
                ▼
         ┌─────────────┐
         │ IN_PROGRESS │
         └──────┬──────┘
                │ developer entrega
                ▼
          ┌───────────┐
          │ SUBMITTED │
          └─────┬─────┘
                │ company revisa y aprueba
                ▼
          ┌──────────┐
          │ APPROVED │
          └─────┬────┘
                │ pago procesado
                ▼
            ┌──────┐
            │ PAID │  ← Estado final
            └──────┘
```

| Transición | Actor | Endpoint |
|------------|-------|----------|
| `PENDING → IN_PROGRESS` | DEVELOPER | (manual o automático) |
| `IN_PROGRESS → SUBMITTED` | DEVELOPER | `PATCH /contracts/:id/milestones/:mid/submit` |
| `SUBMITTED → APPROVED` | COMPANY | `PATCH /contracts/:id/milestones/:mid/approve` |
| `APPROVED → PAID` | Sistema / Stripe | (fase 2 — integración de pagos) |

---

## Resumen de estados por entidad

| Entidad | Estados | Estado inicial | Estado(s) final(es) |
|---------|---------|----------------|---------------------|
| `Project` | 5 | `DRAFT` | `COMPLETED`, `CANCELLED` |
| `Proposal` | 4 | `PENDING` | `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `Contract` | 4 | `ACTIVE` | `COMPLETED`, `CANCELLED` |
| `Milestone` | 5 | `PENDING` | `PAID` |
