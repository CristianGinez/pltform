# ADR-011 — Arquitectura feature-based en el frontend

**Estado:** Aceptado
**Fecha:** 2026-03-13

---

## Contexto

El archivo `frontend/src/app/(dashboard)/dashboard/contracts/[id]/page.tsx` creció a ~1908 líneas con toda la lógica de contratos, milestones, chat, propuestas, disputas y reviews en un único componente. Era imposible de mantener, difícil de revisar en PRs y causaba re-renders innecesarios.

El resto del dashboard también tenía páginas gordas: `admin/page.tsx` con 600+ líneas, `projects/page.tsx` con lógica mezclada.

---

## Decisión

Migrar a una **arquitectura feature-based** donde cada dominio de negocio tiene su propia carpeta en `src/features/<dominio>/`:

```
src/features/
  contracts/
    constants.ts         # STATUS_LABELS, STATUS_COLORS, TAB_ORDER, etc.
    utils.tsx            # MilestoneStatusIcon, EventIcon helpers
    components/
      ContractDetailPage.tsx   # orquestador principal (~250 líneas)
      MilestonesTab.tsx
      MilestoneStep.tsx
      ChatTab.tsx
      ChatMessage.tsx
      ResumenTab.tsx
      ProposeModal.tsx
      CounterModal.tsx
      DisputeModal.tsx
      MilestonePlanModal.tsx
      ProfileCard.tsx
      RepublishButton.tsx
  projects/
    constants.ts
    components/
      DashboardProjectCard.tsx
      DashboardProjectsPage.tsx
  admin/
    components/
      AdminDashboardPage.tsx
```

Las páginas de Next.js (`app/**/page.tsx`) se convierten en **thin wrappers**:

```tsx
// app/(dashboard)/dashboard/contracts/[id]/page.tsx
'use client';
import { ContractDetailPage } from '@/features/contracts/components/ContractDetailPage';
export default ContractDetailPage;
```

---

## Consecuencias

**Positivas:**
- Cada archivo tiene una responsabilidad única y es revisable en menos de 5 minutos
- Los cambios en un feature no afectan otros features
- Tree-shaking más eficiente (Next.js solo bundlea lo que se usa por ruta)
- Los tests unitarios futuros pueden importar componentes individuales

**Negativas / trade-offs:**
- Más archivos que mantener sincronizados
- Los imports son más largos (`@/features/contracts/components/...`)

---

## Regla general

- `features/<dominio>/constants.ts` — solo constantes y tipos locales (sin JSX; usar `React.createElement` si se necesitan nodos)
- `features/<dominio>/utils.tsx` — helpers con JSX ligero
- `features/<dominio>/components/` — componentes React
- `app/**/page.tsx` — máximo 10 líneas, solo re-exporta el componente feature
