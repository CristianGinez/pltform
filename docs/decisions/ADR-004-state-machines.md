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

Implementar máquinas de estado unidireccionales para las cuatro entidades. El backend lanza `BadRequestException` si se intenta una transición inválida.

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

Milestone: PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID
```

---

## Implementación

Cada módulo valida el estado actual antes de ejecutar la transición:

```typescript
// Ejemplo en ProposalsService
async accept(proposalId: string, companyId: string) {
  const proposal = await this.prisma.proposal.findUnique(...);

  if (proposal.status !== ProposalStatus.PENDING) {
    throw new BadRequestException('Solo se pueden aceptar propuestas en estado PENDING');
  }
  // ... ejecutar transacción
}
```

Las transiciones con efectos secundarios se ejecutan en transacciones de Prisma:

- `PENDING → ACCEPTED` en Proposal: rechaza las demás propuestas + crea Contract + cambia Project a IN_PROGRESS
- `APPROVED → PAID` en Milestone: si todos los milestones son PAID, cierra Contract y Project

---

## Consecuencias

**Positivas:**
- La integridad del negocio se garantiza en la capa de servicio
- Es imposible saltarse pasos del flujo (ej: pagar un milestone no aprobado)
- Los estados finales (`COMPLETED`, `CANCELLED`, `PAID`, `WITHDRAWN`, `REJECTED`) son terminales: una vez alcanzados no cambian
- El historial de estados es implícito: si un proyecto está `IN_PROGRESS`, necesariamente pasó por `DRAFT` y `OPEN`

**Negativas / Trade-offs:**
- No hay tabla de historial de transiciones (audit log). Si se necesita saber "cuándo pasó de OPEN a IN_PROGRESS", no está almacenado actualmente
- Las transiciones con efectos secundarios (aceptar propuesta) son complejas: requieren transacciones de DB con múltiples operaciones
- Si en el futuro se necesita una transición inversa (ej: re-abrir un proyecto cancelado), el diseño debe revisarse
