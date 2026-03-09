# ADR-004 — Máquinas de estado unidireccionales

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

Cuatro entidades del sistema tienen ciclos de vida complejos con múltiples estados: `Project`, `Proposal`, `Contract` y `Milestone`. Se debe decidir cómo modelar y controlar las transiciones de estado.

---

## Alternativas consideradas

### Opción A: Campos booleanos por estado

```
Project { isOpen: boolean, isInProgress: boolean, isCompleted: boolean, isCancelled: boolean }
```

**Contras:** Estados mutuamente excluyentes no se garantizan a nivel de DB. Difícil de razonar. No escala.

### Opción B: Enum con transiciones libres

Usar un enum pero permitir cualquier transición desde la API sin validar el estado anterior.

**Contras:** Un proyecto podría pasar de `DRAFT` a `COMPLETED` directamente. Pérdida de integridad de negocio.

### Opción C: Enum con máquina de estados validada en el backend (elegida)

Cada entidad tiene un campo `status` de tipo enum. El backend valida que la transición sea válida antes de ejecutarla. Las transiciones son **unidireccionales**: no se puede volver a un estado anterior.

---

## Decisión

Implementar máquinas de estado para las cuatro entidades. El backend lanza `BadRequestException` si se intenta una transición inválida. `Milestone` tiene un ciclo bidireccional controlado para soportar revisiones.

```
Project:   DRAFT → OPEN → IN_PROGRESS → COMPLETED
                 ↘
                  CANCELLED (desde DRAFT u OPEN)

Proposal:  PENDING → ACCEPTED
                   → REJECTED
                   → WITHDRAWN

Contract:  ACTIVE → COMPLETED
                  → DISPUTED
                  → CANCELLED

Milestone: PENDING → IN_PROGRESS → SUBMITTED ──→ PAID
                                       ↑    ↘
                                       │     REVISION_REQUESTED
                                       └─────────────┘
```

**Excepción controlada:** `Milestone` permite el ciclo `SUBMITTED → REVISION_REQUESTED → SUBMITTED` para gestionar iteraciones de revisión sin abrir disputas. Esto no viola el principio general ya que `REVISION_REQUESTED` es un estado intermedio, no un retroceso terminal.

---

## Implementación

Cada módulo valida el estado actual antes de ejecutar la transición:

```typescript
// Ejemplo en ContractsService
async startMilestone(contractId, milestoneId, userId) {
  const milestone = await this.prisma.milestone.findFirst({ ... });
  if (milestone.status !== 'PENDING')
    throw new BadRequestException('El milestone no está en estado PENDING');
  return this.prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });
}
```

Las transiciones con efectos secundarios se ejecutan directamente (Milestone no usa transacciones):

- `PENDING → ACCEPTED` en Proposal: rechaza las demás propuestas + crea Contract + cambia Project a IN_PROGRESS (transacción Prisma)
- `SUBMITTED → PAID` en Milestone (via approve): si todos los milestones son PAID → Contract y Project pasan a COMPLETED + notificaciones a ambas partes

---

## Consecuencias

**Positivas:**
- La integridad del negocio se garantiza en la capa de servicio
- Es imposible saltarse pasos del flujo (ej: pagar un milestone no entregado)
- Los estados finales (`COMPLETED`, `CANCELLED`, `PAID`, `WITHDRAWN`, `REJECTED`) son terminales
- Los timestamps `startedAt` y `submittedAt` en Milestone proveen trazabilidad básica sin necesitar un audit log completo
- El ciclo de revisión es explícito y rastreable: el estado `REVISION_REQUESTED` es visible para ambas partes

**Negativas / Trade-offs:**
- No hay tabla de historial de transiciones (audit log). Si se necesita saber "cuánto tiempo tardó en pasar de PENDING a PAID", la información es parcial
- El ciclo de revisión en Milestone rompe la estricta unidireccionalidad; compensado por validación explícita en cada endpoint
- Si en el futuro se necesita saber cuántas iteraciones de revisión tuvo un milestone, habría que agregar un contador o tabla de eventos
