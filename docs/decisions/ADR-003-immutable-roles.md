# ADR-003 — Roles inmutables asignados en el registro

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

El sistema tiene tres roles: `COMPANY`, `DEVELOPER` y `ADMIN`. Cada rol tiene permisos y flujos de negocio completamente distintos. Se debe decidir si un usuario puede cambiar de rol después del registro.

---

## Alternativas consideradas

### Opción A: Roles mutables (el usuario puede cambiar de rol)

Un usuario podría registrarse como `DEVELOPER` y luego convertirse en `COMPANY`.

**Contras:**
- ¿Qué pasa con las propuestas enviadas como `DEVELOPER` si ahora es `COMPANY`?
- ¿Se mantienen ambos perfiles? ¿Se elimina el anterior?
- Complica la lógica de autorización: el `role` en el JWT podría estar desactualizado
- Genera inconsistencias en el historial de contratos y transacciones

### Opción B: Roles inmutables (elegida)

El `role` se asigna en el momento del registro y no puede modificarse nunca.

**Pros:**
- La lógica de autorización es simple y predecible: `RolesGuard` lee el `role` del JWT y decide
- No hay estados intermedios ni migraciones de datos
- El JWT siempre refleja el rol real del usuario
- Los perfiles (`Company`, `Developer`) tienen una semántica clara y permanente

---

## Decisión

El `role` es inmutable. Se asigna al crear el `User` y no existe ningún endpoint para modificarlo. Si un usuario necesita operar con otro rol, debe registrar una cuenta nueva.

---

## Implementación

```
POST /api/auth/register
  body: { email, password, role: "COMPANY" | "DEVELOPER" }
  → crea User con el role dado
  → crea Company o Developer según el role
  → emite JWT con { sub: userId, email, role }
```

El `RolesGuard` en NestJS simplemente compara `request.user.role` contra el decorator `@Roles(...)`:

```typescript
@Roles(Role.COMPANY)
@Post('projects')
createProject() { ... }
```

---

## Consecuencias

**Positivas:**
- `RolesGuard` es stateless: no necesita consultar la base de datos para verificar el rol
- El token JWT contiene el rol correcto durante toda su vida útil
- No hay lógica de migración entre perfiles
- Simplifica las pruebas: un usuario de prueba tiene siempre el mismo rol

**Negativas / Trade-offs:**
- Un usuario no puede probar ambas caras del marketplace con la misma cuenta
- Si en el futuro se necesitan roles mixtos (ej: una empresa que también es developer), se requerirá un cambio de schema significativo
- El script `tools/scripts/create-user.js` puede crear usuarios ADMIN pero no existe un flujo de UI para ello (solo CLI)
