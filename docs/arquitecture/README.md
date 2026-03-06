# Arquitectura — Pltform

Documentación técnica de la arquitectura del sistema basada en el schema de Prisma.

---

## Archivos de arquitectura

| Archivo | Contenido |
|---------|-----------|
| [01-overview.md](./01-overview.md) | Visión general, capas y principios |
| [02-data-model.md](./02-data-model.md) | Modelos de datos, campos y relaciones |
| [03-entity-relations.md](./03-entity-relations.md) | Diagrama de entidades y cardinalidades |
| [04-enums-states.md](./04-enums-states.md) | Enums, máquinas de estado y transiciones |
| [05-indexes-constraints.md](./05-indexes-constraints.md) | Índices, constraints y decisiones de BD |
| [06-business-flows.md](./06-business-flows.md) | Flujos de negocio end-to-end |

---

## Stack de datos

```
PostgreSQL 17
    └── Prisma ORM 5
            ├── schema.prisma       (fuente de verdad)
            ├── migrations/         (historial de cambios)
            └── @prisma/client      (tipos generados + query builder)
```
