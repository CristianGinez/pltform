# ADR-005 — Hard delete con eliminación en cascada

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

Cuando una entidad padre se elimina, se debe decidir qué ocurre con sus entidades hijas. Las dos estrategias principales son:

- **Hard delete:** eliminar físicamente los registros de la base de datos
- **Soft delete:** marcar los registros como eliminados (`deletedAt: DateTime?`) sin borrarlos físicamente

---

## Alternativas consideradas

### Opción A: Soft delete global

Agregar `deletedAt: DateTime?` a todos los modelos. Las queries filtran por `deletedAt IS NULL`.

**Pros:** Los datos se conservan. Permite "deshacer" eliminaciones. Facilita auditorías.

**Contras:**
- Todas las queries deben incluir `WHERE deletedAt IS NULL`. Prisma no tiene soporte nativo de soft delete; requiere middleware o queries manuales
- Las constraints únicas se vuelven ambiguas: ¿puede existir un nuevo `User` con el mismo email si el anterior fue soft-deleted?
- Mayor complejidad operativa en esta fase del proyecto

### Opción B: Hard delete con cascada (elegida)

Usar `onDelete: Cascade` en las relaciones críticas. Al eliminar una entidad padre, PostgreSQL elimina automáticamente todas las entidades hijas.

**Pros:** Simple. La integridad referencial la garantiza la base de datos. Sin middleware adicional.

**Contras:** La eliminación es irreversible. Requiere confirmación explícita del usuario antes de borrar.

### Opción C: Restrict (no permitir eliminación)

Usar `onDelete: Restrict` en todas las relaciones para impedir eliminar entidades con dependientes.

**Contras:** La aplicación se vuelve difícil de limpiar en desarrollo. En producción no tiene sentido si un usuario quiere cerrar su cuenta.

---

## Decisión

**Hard delete con `onDelete: Cascade`** en la jerarquía principal de entidades. Una excepción: `Project → Contract` usa `Restrict` para evitar eliminar proyectos con contratos activos accidentalmente.

```
DELETE User
  ├── CASCADE → Company
  │     └── CASCADE → Project[]
  │           ├── CASCADE → Proposal[]
  │           └── RESTRICT → Contract  (no se puede borrar si existe)
  │                 └── CASCADE → Milestone[]
  └── CASCADE → Developer
        └── CASCADE → Proposal[]
```

---

## Consecuencias

**Positivas:**
- Sin complejidad adicional en las queries de Prisma
- Las constraints únicas funcionan correctamente (email liberado al eliminar usuario)
- PostgreSQL garantiza la integridad; no depende de la lógica de aplicación

**Negativas / Trade-offs:**
- Eliminar un `User` tipo `COMPANY` destruye toda su historia: proyectos, propuestas, contratos, milestones. Esta operación es irreversible
- No hay papelera de reciclaje ni historial de datos eliminados
- En una fase futura, si se requiere cumplimiento regulatorio (GDPR) o auditoría, será necesario migrar a soft delete o a un sistema de archivado separado
- Los contratos activos (`Contract`) tienen `Restrict` implícito: antes de eliminar un proyecto con contrato, el contrato debe cerrarse o cancelarse manualmente
