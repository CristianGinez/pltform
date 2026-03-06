# 05 — Índices, Constraints y Decisiones de Base de Datos

---

## Índices definidos en el schema

| Modelo | Campo(s) | Tipo | Razón |
|--------|----------|------|-------|
| `User` | `email` | Simple | Lookup frecuente en login y verificación de duplicados |
| `Project` | `status` | Simple | Filtrado masivo de proyectos por estado (lista pública) |
| `Project` | `companyId` | Simple | Obtener todos los proyectos de una empresa |
| `Proposal` | `projectId` | Simple | Obtener todas las propuestas de un proyecto |
| `Proposal` | `developerId` | Simple | Obtener todas las propuestas de un developer |
| `Milestone` | `contractId` | Simple | Obtener todos los milestones de un contrato |

---

## Constraints de unicidad

| Modelo | Campo(s) | Descripción |
|--------|----------|-------------|
| `User` | `email` | No pueden existir dos usuarios con el mismo email |
| `Company` | `userId` | Una relación 1:1 estricta User → Company |
| `Developer` | `userId` | Una relación 1:1 estricta User → Developer |
| `Contract` | `projectId` | Un proyecto solo puede tener un contrato activo |
| `Proposal` | `[projectId, developerId]` | Un developer no puede postular dos veces al mismo proyecto |

---

## Tipos de datos y precisión

| Campo | Tipo Prisma | Tipo PostgreSQL | Razón |
|-------|-------------|-----------------|-------|
| `Project.budget` | `Decimal` | `DECIMAL(10, 2)` | Evita errores de punto flotante en dinero |
| `Developer.hourlyRate` | `Decimal?` | `DECIMAL(10, 2)` | Idem. Nullable porque es opcional |
| `Proposal.budget` | `Decimal` | `DECIMAL(10, 2)` | Idem |
| `Milestone.amount` | `Decimal` | `DECIMAL(10, 2)` | Idem |
| `Contract.platformFee` | `Decimal` | `DECIMAL(5, 2)` | % de comisión (0.00 - 999.99) |
| `Developer.skills` | `String[]` | `TEXT[]` | Array nativo de PostgreSQL |
| `Project.skills` | `String[]` | `TEXT[]` | Idem |
| `Developer.rating` | `Float` | `FLOAT8` | Promedio calculado (0.0 - 5.0) |

> **Por qué `Decimal` y no `Float` para montos:**
> `Float` tiene imprecisión binaria (ej: `0.1 + 0.2 = 0.30000000000000004`).
> Para valores monetarios siempre se usa `DECIMAL` con precisión fija.

---

## Comportamiento de eliminación (onDelete)

| Relación | Comportamiento | Implicación |
|----------|----------------|-------------|
| `User → Company` | `Cascade` | Eliminar user borra el perfil empresa |
| `User → Developer` | `Cascade` | Eliminar user borra el perfil developer |
| `Company → Project` | `Cascade` | Eliminar empresa borra todos sus proyectos |
| `Project → Proposal` | `Cascade` | Eliminar proyecto borra todas sus propuestas |
| `Project → Contract` | `Restrict` (default) | No se puede eliminar un proyecto con contrato activo |
| `Developer → Proposal` | `Cascade` | Eliminar developer borra sus propuestas |
| `Contract → Milestone` | `Cascade` | Eliminar contrato borra todos sus milestones |

---

## Queries más frecuentes y su optimización

### Lista pública de proyectos
```sql
SELECT * FROM "Project"
WHERE status = 'OPEN'
ORDER BY "createdAt" DESC;
-- Usa índice en: status
```

### Proyectos de una empresa
```sql
SELECT * FROM "Project"
WHERE "companyId" = $1
ORDER BY "createdAt" DESC;
-- Usa índice en: companyId
```

### Propuestas de un proyecto
```sql
SELECT * FROM "Proposal"
WHERE "projectId" = $1;
-- Usa índice en: projectId
```

### Propuestas de un developer
```sql
SELECT * FROM "Proposal"
WHERE "developerId" = $1;
-- Usa índice en: developerId
```

### Login (lookup por email)
```sql
SELECT * FROM "User"
WHERE email = $1;
-- Usa índice en: email + UNIQUE constraint
```

---

## Decisiones de diseño

### ¿Por qué arrays nativos (`String[]`) para `skills`?

**Alternativa considerada:** Tabla separada `Skill` con relación M:N.

**Decisión:** Arrays nativos de PostgreSQL por:
- Simplicidad en la fase inicial
- No se requiere normalización estricta de skills (son strings libres)
- PostgreSQL soporta queries sobre arrays: `WHERE 'React' = ANY(skills)`
- Prisma genera el tipo correcto para TypeScript

**Trade-off:** No se pueden hacer joins eficientes con skills. Si en el futuro se necesita un catálogo de skills normalizado (con conteos, sinónimos, etc.), sería necesario migrar a una tabla separada.

### ¿Por qué CUID y no UUID o serial?

| ID | Pros | Contras |
|----|------|---------|
| `SERIAL` (auto-increment) | Simple, pequeño | Predecible, revela volumen del negocio |
| `UUID v4` | Estándar, muy único | Largo (36 chars), impacto en índices B-tree |
| `CUID` ✓ | Ordenable por tiempo, URL-safe, corto | Menos estándar |

Los CUIDs comienzan con `c` seguido de timestamp + fingerprint + counter + random, lo que los hace **aproximadamente ordenados por tiempo de inserción**.

### ¿Por qué `platformFee` en el contrato?

La comisión se guarda en el contrato al momento de su creación. Esto permite:
- Cambiar la comisión global sin afectar contratos existentes
- Auditoría: saber exactamente qué comisión se aplicó a cada contrato
- Negociaciones especiales por empresa (en el futuro)
