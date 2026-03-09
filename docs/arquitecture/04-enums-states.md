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

Ciclo de vida de un hito de entrega, incluyendo el ciclo de revisiones.

```
           ┌─────────┐
           │ PENDING │  ← Estado inicial
           └────┬────┘
                │ DEVELOPER: "Iniciar"
                ▼
         ┌─────────────┐
         │ IN_PROGRESS │
         └──────┬──────┘
                │ DEVELOPER: "Entregar" (nota + link)
                ▼
          ┌───────────┐
          │ SUBMITTED │◀─────────────────────────┐
          └─────┬─────┘                          │
        ┌───────┴────────┐                       │
        │                │                       │
        ▼                ▼                       │
   COMPANY:         COMPANY:                     │
   "Aprobar"     "Pedir revisión"                │
        │                │                       │
        ▼                ▼                       │
    ┌──────┐   ┌────────────────────┐            │
    │ PAID │   │ REVISION_REQUESTED │────────────┘
    └──────┘   └────────────────────┘
  Estado final   DEVELOPER: "Volver a entregar"
```

| Transición | Actor | Endpoint |
|------------|-------|----------|
| `PENDING → IN_PROGRESS` | DEVELOPER | `PATCH /contracts/:id/milestones/:mid/start` |
| `IN_PROGRESS → SUBMITTED` | DEVELOPER | `PATCH /contracts/:id/milestones/:mid/submit` (body: `deliveryNote`, `deliveryLink`) |
| `SUBMITTED → PAID` | COMPANY | `PATCH /contracts/:id/milestones/:mid/approve` (simula liberación de escrow) |
| `SUBMITTED → REVISION_REQUESTED` | COMPANY | `PATCH /contracts/:id/milestones/:mid/request-revision` (body: `reason`) |
| `REVISION_REQUESTED → SUBMITTED` | DEVELOPER | `PATCH /contracts/:id/milestones/:mid/submit` (re-entrega) |

**Notas:**
- Al aprobar, el sistema pasa directamente de `SUBMITTED → PAID` (el estado `APPROVED` ya no existe en el flujo activo).
- Si todos los milestones del contrato quedan en `PAID`, el sistema automáticamente marca el `Contract` y el `Project` como `COMPLETED`.
- El developer puede re-entregar desde `REVISION_REQUESTED` usando el mismo endpoint de submit.

---

## NotificationType

Tipos de notificaciones generadas por el sistema.

| Tipo | Generada cuando | Destinatario |
|------|-----------------|--------------|
| `PROPOSAL_RECEIVED` | Developer postula a un proyecto | COMPANY |
| `PROPOSAL_ACCEPTED` | Empresa acepta una propuesta | DEVELOPER |
| `PROPOSAL_REJECTED` | Empresa rechaza una propuesta | DEVELOPER |
| `PROPOSAL_WITHDRAWN` | Developer retira su propuesta | COMPANY |
| `CONTRACT_CREATED` | Se crea el contrato | DEVELOPER |
| `MILESTONE_STARTED` | Developer inicia un milestone | COMPANY |
| `MILESTONE_SUBMITTED` | Developer entrega un milestone | COMPANY |
| `MILESTONE_REVISION_REQUESTED` | Empresa pide revisión con motivo | DEVELOPER |
| `MILESTONE_PAID` | Milestone aprobado y pagado automáticamente | DEVELOPER |
| `CONTRACT_COMPLETED` | Todos los milestones están PAID | COMPANY + DEVELOPER |

---

## Resumen de estados por entidad

| Entidad | Estados | Estado inicial | Estado(s) final(es) |
|---------|---------|----------------|---------------------|
| `Project` | 5 | `DRAFT` | `COMPLETED`, `CANCELLED` |
| `Proposal` | 4 | `PENDING` | `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `Contract` | 4 | `ACTIVE` | `COMPLETED`, `CANCELLED` |
| `Milestone` | 6 | `PENDING` | `PAID` |
