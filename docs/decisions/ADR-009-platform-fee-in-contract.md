# ADR-009 — Comisión de plataforma almacenada en el contrato

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

La plataforma cobra una comisión (`platformFee`) sobre cada transacción. Se debe decidir dónde almacenar este porcentaje y en qué momento se determina.

El valor por defecto actual es **10%**. En el futuro podría cambiar, y diferentes empresas podrían tener tarifas negociadas.

---

## Alternativas consideradas

### Opción A: Configuración global (variable de entorno o tabla de configuración)

```
# .env
PLATFORM_FEE=10

# O tabla:
Config { key: "platform_fee", value: "10" }
```

El fee se lee en tiempo de ejecución cada vez que se procesa un pago.

**Pros:** Cambio instantáneo sin migración de datos.

**Contras:**
- Si la tarifa cambia de 10% a 12%, todos los contratos existentes (aún activos) serían recalculados con la nueva tarifa → violación de lo pactado
- Imposible auditar qué tarifa se aplicó a un contrato específico histórico
- Inconsistencia legal: el contrato firmado especificaba 10%, el sistema cobra 12%

### Opción B: Almacenar el fee en cada `Milestone`

Guardar el fee en cada hito de pago.

**Contras:** Si un contrato tiene 5 milestones, el fee se repite 5 veces. Si se necesita cambiar el fee de un contrato, se deben actualizar todos sus milestones. Redundancia sin beneficio.

### Opción C: Almacenar el fee en el `Contract` al momento de su creación (elegida)

```prisma
model Contract {
  platformFee Decimal  // Snapshot del fee en el momento de creación
}
```

El fee se copia del valor global vigente cuando se crea el contrato. Queda "congelado" para ese contrato.

---

## Decisión

La `platformFee` se almacena en el modelo `Contract` al momento de su creación con el valor global vigente. Ningún cambio posterior en la tarifa global afecta contratos ya existentes.

```typescript
// En ProposalsService.accept()
const PLATFORM_FEE_DEFAULT = new Decimal(10); // 10%

const contract = await prisma.contract.create({
  data: {
    projectId,
    platformFee: PLATFORM_FEE_DEFAULT,
    status: ContractStatus.ACTIVE,
    milestones: { create: [...] }
  }
});
```

---

## Cálculo de pago

```
Ejemplo con platformFee = 10%:

  Milestone.amount     = $4,500.00
  Comisión plataforma  = $4,500.00 × 10% = $450.00
  Pago neto developer  = $4,500.00 - $450.00 = $4,050.00
  Ingreso plataforma   = $450.00
```

---

## Consecuencias

**Positivas:**
- **Inmutabilidad contractual:** el fee pactado al momento de firmar el contrato no cambia aunque la tarifa global cambie
- **Auditoría:** se puede saber exactamente qué tarifa se aplicó a cada contrato históricamente
- **Flexibilidad futura:** permite tarifas diferenciadas por empresa (descuentos para cuentas enterprise) sin cambiar la lógica de pago
- **Stripe-ready:** cuando se integre Stripe, el `contract.platformFee` se usa directamente para calcular `application_fee_amount`

**Negativas / Trade-offs:**
- Si se quiere cambiar el fee de un contrato en curso (ej: como gesto comercial), se necesita un endpoint de administración específico
- El valor por defecto está hardcodeado en el servicio. En el futuro debería venir de una tabla de configuración o variable de entorno para facilitar cambios sin redeploy
