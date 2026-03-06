# Decisions — Architecture Decision Records (ADR)

Registro de decisiones arquitectónicas del proyecto **pltform**.

Cada ADR documenta una decisión técnica importante: su contexto, las alternativas consideradas, la decisión tomada y sus consecuencias.

---

## Índice

| ADR | Título | Estado |
|-----|--------|--------|
| [ADR-001](./ADR-001-tech-stack.md) | Selección del stack tecnológico | Aceptado |
| [ADR-002](./ADR-002-user-profile-separation.md) | Separación de identidad y perfil de usuario | Aceptado |
| [ADR-003](./ADR-003-immutable-roles.md) | Roles inmutables asignados en el registro | Aceptado |
| [ADR-004](./ADR-004-state-machines.md) | Máquinas de estado unidireccionales | Aceptado |
| [ADR-005](./ADR-005-hard-delete-cascade.md) | Hard delete con eliminación en cascada | Aceptado |
| [ADR-006](./ADR-006-cuid-identifiers.md) | CUID como identificadores primarios | Aceptado |
| [ADR-007](./ADR-007-decimal-monetary.md) | DECIMAL para valores monetarios | Aceptado |
| [ADR-008](./ADR-008-skills-as-arrays.md) | Skills como arrays nativos de PostgreSQL | Aceptado |
| [ADR-009](./ADR-009-platform-fee-in-contract.md) | Comisión de plataforma almacenada en el contrato | Aceptado |

---

## Estados posibles

- **Propuesto** — en discusión, aún no implementado
- **Aceptado** — decisión tomada e implementada
- **Deprecado** — fue la decisión anterior, ya reemplazada
- **Reemplazado por** — indica el ADR que lo sucede
