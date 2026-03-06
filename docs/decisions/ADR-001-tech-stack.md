# ADR-001 — Selección del stack tecnológico

**Estado:** Aceptado
**Fecha:** 2024

---

## Contexto

Se requiere construir un marketplace B2B de dos lados que conecta empresas con desarrolladores de software. El sistema necesita:

- Una interfaz web moderna con navegación tipo SPA y páginas públicas indexables por SEO
- Una API REST robusta con autenticación, autorización basada en roles y lógica de negocio compleja
- Una base de datos relacional que garantice integridad referencial entre entidades con relaciones complejas

El equipo tiene experiencia en TypeScript. Se prioriza la consistencia del lenguaje en todo el stack.

---

## Alternativas consideradas

### Frontend

| Opción | Pros | Contras |
|--------|------|---------|
| **Next.js 14** | SSR/SSG, App Router, ecosistema React, Vercel deploy | Complejidad de hidratación |
| Vite + React SPA | Simple, rápido en dev | Sin SSR nativo, peor SEO |
| Remix | SSR, forms nativas | Ecosistema más pequeño |

### Backend

| Opción | Pros | Contras |
|--------|------|---------|
| **NestJS** | Arquitectura modular, DI, decoradores, TypeScript first | Verboso, curva de aprendizaje |
| Express | Minimalista, flexible | Sin estructura impuesta, más boilerplate |
| Fastify | Muy rápido | Menos convenciones que NestJS |

### Base de datos

| Opción | Pros | Contras |
|--------|------|---------|
| **PostgreSQL** | Relacional, ACID, arrays nativos, madurez | Setup más complejo que SQLite |
| MySQL | Popular, cloud-friendly | Menos features que PostgreSQL |
| MongoDB | Flexible, sin schema | No garantiza integridad relacional; el modelo de datos es relacional |

### ORM

| Opción | Pros | Contras |
|--------|------|---------|
| **Prisma** | Schema-first, type-safe, migraciones, Studio UI | Genera queries menos optimizables que SQL raw |
| TypeORM | Decoradores, familiar para Java/Spring devs | Bugs conocidos, tipado menos seguro |
| Drizzle | SQL-like, ligero | Más joven, menos documentación |

---

## Decisión

- **Frontend:** Next.js 14 con App Router, React, TypeScript, Tailwind CSS, Zustand, TanStack Query
- **Backend:** NestJS con TypeScript
- **Base de datos:** PostgreSQL 17
- **ORM:** Prisma

---

## Consecuencias

**Positivas:**
- TypeScript en todo el stack: tipos compartibles, refactoring seguro
- Prisma genera tipos automáticamente desde el schema → el frontend y backend pueden compartir interfaces
- NestJS fuerza una estructura modular que escala bien con el crecimiento del equipo
- Next.js App Router permite SSR en páginas públicas (SEO) y client components en el dashboard

**Negativas / Trade-offs:**
- La hidratación de Zustand en Next.js (SSR) requiere manejo especial del estado inicial (ver ADR-002 y el flag `_hasHydrated`)
- Prisma tiene limitaciones con queries muy complejas; para optimizaciones futuras se puede usar `$queryRaw`
- NestJS genera más boilerplate que Express para endpoints simples
