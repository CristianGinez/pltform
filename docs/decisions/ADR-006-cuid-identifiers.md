# ADR-006 — CUID como identificadores primarios

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

Todos los modelos del sistema necesitan un identificador primario único. Se debe elegir el tipo de ID que usará Prisma por defecto en todos los modelos.

---

## Alternativas consideradas

| Estrategia | Ejemplo | Pros | Contras |
|------------|---------|------|---------|
| `SERIAL` / autoincrement | `1`, `2`, `3` | Simple, pequeño (4 bytes), rápido en índices B-tree | Secuencial → predecible → expone volumen del negocio. No es seguro en URLs |
| `UUID v4` | `550e8400-e29b-41d4-a716-446655440000` | Estándar, globalmente único, no secuencial | 36 caracteres, impacto negativo en índices B-tree por aleatoriedad total |
| `UUID v7` | `018e8d7f-...` | Ordenable por tiempo, estándar emergente | Menos soporte en Prisma, no disponible en `@default()` sin extensión |
| `CUID` | `clh3k2m0f0000qzrmn5y8jqo3` | Ordenable por tiempo, URL-safe, corto (~25 chars), sin coordinación | Menos estándar que UUID. Deprecado en favor de CUID2 |
| `CUID2` | `tz4a98xxat96iws9zmbrgj3a` | Más seguro criptográficamente que CUID | Soporte en Prisma desde v4.5+ |

---

## Decisión

Usar **CUID** mediante `@default(cuid())` de Prisma en todos los modelos.

```prisma
model User {
  id String @id @default(cuid())
  ...
}
```

---

## Razones

1. **No secuencial:** No revela el volumen de registros del negocio a través de la URL
2. **URL-safe:** Solo contiene caracteres alfanuméricos en minúsculas. Seguro en rutas como `/projects/clh3k2m0f0000qzrmn`
3. **Aproximadamente ordenado por tiempo:** El prefijo contiene un timestamp, lo que mantiene localidad en los índices B-tree (mejor rendimiento que UUID v4 puro)
4. **Soporte nativo en Prisma:** `@default(cuid())` funciona sin extensiones de PostgreSQL
5. **Longitud razonable:** ~25 caracteres vs 36 de UUID. Más cómodo para logs y debugging

---

## Consecuencias

**Positivas:**
- Los IDs son seguros para exponer en URLs de la API pública
- Los índices B-tree de PostgreSQL se benefician del orden aproximado por tiempo de inserción
- Prisma genera automáticamente el CUID en el cliente antes de insertar (sin round-trip al servidor para obtener el ID)

**Negativas / Trade-offs:**
- CUIDs son más largos que autoincrement (25 vs 4-8 bytes): mayor uso de almacenamiento en índices y claves foráneas
- CUID (v1) está deprecado; la comunidad migra a CUID2. En versiones futuras de Prisma, `@default(cuid())` podría generar CUID2
- Si se necesita interoperabilidad con sistemas externos que esperan UUID, se requerirá conversión
