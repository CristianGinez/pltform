# ADR-010 — Flujo de ejecución de contratos (post-aceptación)

**Estado:** Aceptado
**Fecha:** 2026-03-09

---

## Contexto

Tras implementar el sistema de propuestas y contratos, el siguiente paso crítico es el flujo de trabajo real entre empresa y developer durante la ejecución del contrato. Se deben tomar decisiones sobre:

1. Cómo gestionar el ciclo de vida de milestones con iteraciones de revisión
2. Cómo simular pagos en escrow sin Stripe (fase actual)
3. Qué información capturar en cada entrega de milestone
4. Cómo completar automáticamente el contrato

---

## Decisiones tomadas

### 1. Ciclo de revisiones sin disputa

**Problema:** Un developer entrega, la empresa detecta que falta algo. ¿Cómo pedir correcciones sin abrir una disputa formal?

**Decisión:** Añadir el estado `REVISION_REQUESTED` entre `SUBMITTED` y el ciclo siguiente. La empresa puede pedir revisión con un motivo (texto libre), el developer recibe una notificación y puede volver a entregar usando el mismo endpoint `submit`.

**Alternativa descartada:** Usar el sistema de disputas (`ContractStatus.DISPUTED`) para correcciones menores. Es demasiado pesado para ajustes rutinarios.

---

### 2. Escrow simulado: SUBMITTED → PAID (sin APPROVED intermedio)

**Problema:** El flujo original tenía `SUBMITTED → APPROVED → PAID`. `APPROVED` y `PAID` eran dos pasos separados porque se anticipaba integración con Stripe.

**Decisión:** Eliminar `APPROVED` del flujo activo. Al hacer `approve`, el sistema pasa directamente a `PAID`. Cuando llegue Stripe, el endpoint `approve` llamará a la API de Stripe y, al confirmar el pago, actualizará a `PAID`.

**Razón:** Reduce la complejidad de la UI (un solo botón "Aprobar") y simplifica la máquina de estados. No se pierde funcionalidad; la separación Stripe puede reimplementarse internamente en el servicio sin cambiar la API pública.

---

### 3. Datos de entrega en el Milestone

**Problema:** El developer entrega trabajo pero no hay forma de compartir links o describir qué se hizo.

**Decisión:** Añadir `deliveryNote: String?` y `deliveryLink: String?` al modelo `Milestone`. Se guardan en el `submit` y se muestran en la UI de la empresa.

**Campos de timestamp añadidos:** `startedAt` y `submittedAt` para trazabilidad básica sin un audit log completo.

---

### 4. Auto-completado del contrato

**Decisión:** Cuando el endpoint `approve` pone el último milestone en `PAID`, el sistema automáticamente:
- `Contract.status → COMPLETED`
- `Project.status → COMPLETED`
- Notifica a ambas partes: `CONTRACT_COMPLETED`

**Razón:** Elimina un paso manual para la empresa. El contrato no puede "completarse a medias" — o todos los milestones están pagados o no.

---

## Consecuencias

**Positivas:**
- Flujo completo end-to-end sin intervención manual del admin
- La empresa puede pedir revisiones sin abrir disputas formales
- Trazabilidad básica de tiempos (startedAt, submittedAt)
- La UI es simple: cada milestone muestra exactamente las acciones disponibles para el rol actual

**Negativas / Trade-offs:**
- El contador de iteraciones de revisión no se almacena (no se sabe cuántas veces se pidió revisión)
- El escrow es simulado: el campo `PAID` no garantiza que el dinero haya sido transferido hasta integrar Stripe
- Si un milestone queda en `REVISION_REQUESTED` y el developer no responde, no hay mecanismo de escalada automática (queda para Fase 2 con disputas formales)
