# ADR-008 — Skills como arrays nativos de PostgreSQL

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

Tanto `Developer` como `Project` tienen una lista de tecnologías/habilidades (`skills`). Un developer puede tener skills `["React", "Node.js", "TypeScript"]` y un proyecto puede requerir `["React", "PostgreSQL"]`. Se debe modelar esta relación.

---

## Alternativas consideradas

### Opción A: Tabla normalizada `Skill` con relación M:N

```
Developer ──M:N──▶ Skill (tabla de skills normalizada)
Project   ──M:N──▶ Skill
```

Con tablas intermedias: `DeveloperSkill`, `ProjectSkill`.

**Pros:**
- Normalización estricta: sin duplicados de string
- Permite contar cuántos developers tienen cada skill
- JOIN eficiente para encontrar developers por skill
- Posibilidad de sinónimos, categorías, niveles de experiencia

**Contras:**
- 3 tablas adicionales + 2 tablas de unión = complejidad significativa
- Cada consulta requiere JOINs: `Developer JOIN DeveloperSkill JOIN Skill`
- Requiere migración de datos si los strings de skills no están normalizados (ej: "React" vs "ReactJS")
- Sobrediseño para la fase inicial del proyecto

### Opción B: String separado por comas

```
Developer { skills: "React,Node.js,TypeScript" }
```

**Contras:** Parsing manual. Imposible hacer queries eficientes. Sin type safety.

### Opción C: Array nativo de PostgreSQL (elegida)

```prisma
model Developer {
  skills String[]
}
```

PostgreSQL tiene soporte nativo para arrays de texto (`TEXT[]`). Prisma lo mapea a `String[]` en TypeScript.

**Pros:**
- Simplicidad: un solo campo, sin tablas adicionales
- Type-safe en TypeScript: `developer.skills` es `string[]`
- PostgreSQL soporta queries sobre arrays: `WHERE 'React' = ANY(skills)`
- Sin JOIN requerido

---

## Decisión

Usar **arrays nativos de PostgreSQL** (`String[]` en Prisma / `TEXT[]` en PostgreSQL) para `Developer.skills` y `Project.skills`.

```prisma
model Developer {
  skills String[]
}

model Project {
  skills String[]
}
```

Query de filtrado por skill:
```sql
SELECT * FROM "Developer" WHERE 'React' = ANY(skills);
```

---

## Consecuencias

**Positivas:**
- Cero tablas adicionales para el caso de uso principal
- El frontend recibe y envía `string[]` directamente sin transformación
- Las queries de filtrado básico funcionan con el índice GIN de PostgreSQL (si se añade en el futuro)
- Prisma genera automáticamente el tipo correcto en TypeScript

**Negativas / Trade-offs:**
- No hay normalización: "React", "ReactJS", "react" son tres skills distintos. Se requiere validación en la capa de aplicación o en el frontend
- No se puede hacer JOIN eficiente entre proyectos y developers por skills compartidos; se necesita `WHERE skill = ANY(project.skills) AND skill = ANY(developer.skills)`
- No hay soporte para metadatos por skill (nivel de experiencia, años, certificación)
- Si en el futuro se necesita un catálogo normalizado de skills (con conteos, tendencias, sinónimos), se requerirá una migración de datos significativa hacia la Opción A
