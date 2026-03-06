# ADR-007 — DECIMAL para valores monetarios

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

El sistema maneja valores monetarios en múltiples modelos: presupuestos de proyectos, tarifas por hora, presupuestos de propuestas y montos de milestones. Se debe elegir el tipo de dato adecuado para representar dinero en PostgreSQL y Prisma.

---

## El problema con Float

Los números de punto flotante (`Float` / `FLOAT8`) usan representación binaria IEEE 754, que no puede representar exactamente muchas fracciones decimales:

```
0.1 + 0.2 = 0.30000000000000004  ← en JavaScript/TypeScript con Float
```

Para operaciones financieras, estos errores de redondeo son inaceptables. Un cálculo de comisión podría resultar en `$449.9999999997` en lugar de `$450.00`.

---

## Alternativas consideradas

### Opción A: `Float` / `FLOAT8`

**Pros:** Simple, nativo en JS, soportado por defecto en Prisma.
**Contras:** Imprecisión binaria. Inaceptable para dinero.

### Opción B: `Int` (almacenar en centavos)

Guardar `$4,500.00` como `450000` (centavos). Dividir por 100 al mostrar.

**Pros:** Precisión exacta, aritmética entera.
**Contras:** Confuso en el código y en la DB. Requiere conversión constante. Los errores de división son frecuentes.

### Opción C: `Decimal` / `DECIMAL(10,2)` (elegida)

Usar el tipo `Decimal` de Prisma que mapea a `DECIMAL(precision, scale)` en PostgreSQL.

**Pros:** Precisión exacta para decimales. Semánticamente correcto. Estándar para dinero en bases de datos relacionales.
**Contras:** En JavaScript, Prisma devuelve `Decimal` (de `decimal.js`), no `number`. Requiere conversión al serializar a JSON.

---

## Decisión

Usar `Decimal` de Prisma con precisión fija para todos los campos monetarios:

| Campo | Tipo Prisma | Tipo PostgreSQL | Rango |
|-------|-------------|-----------------|-------|
| `Project.budget` | `Decimal` | `DECIMAL(10, 2)` | Hasta $99,999,999.99 |
| `Developer.hourlyRate` | `Decimal?` | `DECIMAL(10, 2)` | Hasta $99,999,999.99 |
| `Proposal.budget` | `Decimal` | `DECIMAL(10, 2)` | Hasta $99,999,999.99 |
| `Milestone.amount` | `Decimal` | `DECIMAL(10, 2)` | Hasta $99,999,999.99 |
| `Contract.platformFee` | `Decimal` | `DECIMAL(5, 2)` | 0.00% — 999.99% |

---

## Consecuencias

**Positivas:**
- Los cálculos de comisión (`platformFee`) son exactos: `4500.00 × 0.10 = 450.00` sin errores de redondeo
- PostgreSQL almacena y opera con precisión exacta
- La DB rechaza valores con más de 2 decimales

**Negativas / Trade-offs:**
- Prisma retorna objetos `Decimal` (de la librería `decimal.js`), no primitivos `number` de JavaScript
- Al serializar a JSON (respuestas de la API), los `Decimal` se convierten a strings por defecto. El frontend debe parsear los valores monetarios correctamente
- Las operaciones aritméticas en el backend deben usar la API de `Decimal` en lugar de operadores nativos: `new Decimal(fee).mul(amount)` en lugar de `fee * amount`
