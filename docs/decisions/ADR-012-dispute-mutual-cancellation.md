# ADR-012 — Sistema de disputas y cancelación mutua

**Estado:** Aceptado
**Fecha:** 2026-03-13

---

## Contexto

Sin mecanismo de resolución, un contrato podía quedar atascado indefinidamente:
- Developer desaparece → empresa no puede cerrar el contrato
- Empresa no aprueba milestones → developer no cobra
- Ninguna parte puede cancelar unilateralmente sin perder todo

---

## Decisiones

### 1. Disputa unilateral (`DISPUTED`)

Cualquiera de las dos partes puede escalar un contrato activo a estado `DISPUTED` con un motivo textual.

- `POST /contracts/:id/dispute` — body: `{ reason: string }`
- El contrato pasa a `status = DISPUTED`; se guarda `disputeReason` y `disputeOpenedById`
- Se notifica a la otra parte y a todos los admins
- Se postea un EVENT en el chat: `{ action: 'DISPUTE_OPENED', reason }`

### 2. Resolución por admin

Solo un `ADMIN` puede resolver una disputa: `PATCH /contracts/:id/resolve`

| Outcome | Efecto |
|---------|--------|
| `dev_wins` | Milestones `SUBMITTED` → `PAID`; si todos pagados → `COMPLETED`, si no → `ACTIVE` |
| `company_wins` | `status = CANCELLED`; developer pierde 15 trustPoints (mínimo 0) |
| `mutual` | `status = CANCELLED`; sin penalización |

### 3. Cancelación mutua (`PROPOSE_CANCEL`)

Cualquier parte puede proponer cancelar usando el sistema de propuestas del chat existente (acción `PROPOSE_CANCEL`). Si el otro acepta:
- `status = CANCELLED`
- EVENT en chat: `{ action: 'CONTRACT_CANCELLED_MUTUAL' }`

### 4. Auto-aprobación por vencimiento (7 días)

Si una empresa no responde a un milestone `SUBMITTED` en 7+ días, el developer puede forzar su aprobación:

- `POST /contracts/:id/milestones/:milestoneId/force-approve`
- Verifica: `Date.now() - milestone.submittedAt > 7 días`
- Si cumple → llama internamente a `doApproveMilestone` como si la empresa lo aprobara
- Si no cumple → `BadRequestException`

---

## Cambios en schema

```prisma
model Contract {
  disputeReason      String?
  disputeOpenedById  String?
}

enum NotificationType {
  DISPUTE_OPENED
  DISPUTE_RESOLVED
}
```

---

## UI

- **Banner rojo** cuando `status === 'DISPUTED'` mostrando el motivo
- **Banner gris** cuando `status === 'CANCELLED'`
- **Botón "Abrir disputa"** visible solo en contratos `ACTIVE`
- **Botón "Aprobación automática"** en milestone `SUBMITTED` con 7+ días, solo para el developer
- **Sección "Disputas activas"** en el panel de admin con 3 botones de resolución
- **Acciones de milestone bloqueadas** cuando `contractStatus === 'CANCELLED' || 'DISPUTED'`

---

## Alternativas descartadas

- **Timelock automático (cron)**: descartado porque el proyecto no usa `@nestjs/schedule`. Todo es request-driven.
- **Penalización automática sin admin**: descartado para evitar abusos; un humano debe revisar la evidencia.
