# ADR-013 — UX de la página de contratos: tabs por estado

**Estado:** Aceptado
**Fecha:** 2026-03-13

---

## Contexto

La página `/dashboard/contracts` mostraba todos los contratos en una lista plana sin distinción de estado. Un developer con muchos contratos (activos, completados, cancelados) veía todo mezclado y no podía encontrar rápidamente lo que necesitaba.

---

## Decisión

Implementar **tabs con línea inferior** que filtran contratos por `contract.status`:

| Tab | Estado | Color |
|-----|--------|-------|
| Activos | `ACTIVE` | Azul |
| En disputa | `DISPUTED` | Naranja |
| Completados | `COMPLETED` | Verde |
| Cancelados | `CANCELLED` | Gris |

El tab **Activos** está seleccionado por defecto.

Cada tab muestra el conteo de contratos en ese estado. Si una pestaña tiene 0 contratos, igual aparece (para que el usuario sepa que existe la categoría).

**En mobile**: los tabs tienen `overflow-x-auto` con `min-w-max` en el contenedor interno, permitiendo scroll horizontal. Un degradado `gray-50 → transparente` en el borde derecho indica visualmente que hay más tabs.

---

## Fuente de datos

- **COMPANY**: `GET /projects/my` devuelve proyectos con `contract.status` embebido. Se filtran solo los que tienen contrato (`p.contract !== null`).
- **DEVELOPER**: `GET /proposals/my` devuelve propuestas con `project.contract.status` embebido. Se filtran solo las `ACCEPTED`.

El agrupamiento ocurre en el cliente con `Array.prototype.filter`.

---

## Consecuencias

- El layout shift al cambiar de tab se mitiga con `min-h-48` en el contenedor de contenido
- Si el usuario tiene todos los contratos activos (caso común), ve una lista limpia sin secciones vacías que distraigan
- La página no requiere endpoints adicionales ni state global
