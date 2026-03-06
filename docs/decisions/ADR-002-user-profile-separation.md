# ADR-002 — Separación de identidad y perfil de usuario

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

El sistema tiene dos tipos de actores con datos muy distintos:

- **COMPANY:** nombre de empresa, industria, tamaño, website, logo, ubicación, verificación
- **DEVELOPER:** nombre, bio, skills, tarifa por hora, portfolio, GitHub, LinkedIn, rating

Ambos actores comparten la misma necesidad de autenticación: email + password + JWT.

Se debe decidir cómo modelar la relación entre autenticación y datos de perfil.

---

## Alternativas consideradas

### Opción A: Tabla única con columnas opcionales

```
User { email, passwordHash, role,
       companyName?, industry?, size?,  -- campos de empresa
       bio?, skills?, hourlyRate?, ... } -- campos de developer
```

**Pros:** Simple, una sola tabla para queries de auth.
**Contras:** Muchos `NULL` en cada fila. Viola la 3FN. Difícil de extender.

### Opción B: Tabla User + tablas de perfil separadas (elegida)

```
User { email, passwordHash, role }
  ├── Company { userId, name, industry, size, ... }
  └── Developer { userId, name, bio, skills, ... }
```

**Pros:** Separación de responsabilidades. Cada tabla tiene solo los campos relevantes. Extensible.
**Contras:** Requiere JOIN para obtener datos completos. Más tablas.

### Opción C: Herencia de tabla (tabla por tipo)

Usar herencia de PostgreSQL o tabla abstracta en Prisma.

**Contras:** Prisma no soporta herencia de tabla nativa. Complejidad sin beneficio real.

---

## Decisión

**Opción B:** `User` contiene solo datos de autenticación (`email`, `passwordHash`, `role`). Los datos de negocio y perfil público viven en `Company` o `Developer` con una relación 1:1 hacia `User`.

```
User (auth) ──1:1──▶ Company  (perfil empresa)
             ──1:1──▶ Developer (perfil developer)
```

Solo uno de los dos perfiles estará poblado; nunca ambos.

---

## Consecuencias

**Positivas:**
- `User` es liviano: el guard de autenticación solo carga `id`, `email`, `role` del JWT
- Los perfiles públicos (`Company`, `Developer`) se pueden consultar sin exponer datos de auth
- `passwordHash` es nullable en `User`, lo que permite añadir OAuth (Google, GitHub) en el futuro sin migración de schema
- Cada perfil puede evolucionar independientemente

**Negativas / Trade-offs:**
- Cada endpoint que necesita datos de perfil debe hacer un JOIN: `User → Company` o `User → Developer`
- Al registrar, se crea `User` + su perfil en una única transacción de Prisma para garantizar consistencia
- El guard debe resolver el perfil correspondiente según el `role` del usuario autenticado
