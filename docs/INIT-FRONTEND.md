# INIT — Frontend

Next.js 14 con App Router, TypeScript y Tailwind CSS.

---

## Stack

| Paquete | Uso |
|---------|-----|
| `next` 14 | Framework React con App Router |
| `react` / `react-dom` | UI |
| `typescript` | Tipado estático |
| `tailwindcss` + `@tailwindcss/forms` | Estilos utilitarios |
| `zustand` | Estado global de autenticación |
| `@tanstack/react-query` v5 | Fetching, caché y sincronización de datos |
| `axios` | Cliente HTTP con interceptores JWT |
| `react-hook-form` + `zod` | Formularios con validación |
| `lucide-react` | Iconos |
| `@hookform/resolvers` | Adaptador zod para react-hook-form |

---

## Setup

```bash
# Desde la raíz del monorepo
npm run dev:frontend

# O directamente desde la carpeta
cd frontend
npm run dev
```

Crear `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Estructura de carpetas

```
frontend/src/
├── app/
│   ├── layout.tsx                # Root layout (fuente, providers)
│   ├── providers.tsx             # QueryClientProvider
│   ├── globals.css               # Tailwind base + color tokens
│   ├── page.tsx                  # Landing (/) — totalmente responsive
│   │
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── login/page.tsx        # /login
│   │   └── register/page.tsx     # /register (selector de rol)
│   │
│   ├── (dashboard)/              # Rutas protegidas (layout con sidebar)
│   │   ├── layout.tsx            # Sidebar desktop + bottom tabs mobile + auth guard
│   │   └── dashboard/
│   │       ├── page.tsx                    # /dashboard — overview con stats
│   │       ├── projects/
│   │       │   ├── page.tsx               # /dashboard/projects — lista
│   │       │   ├── new/page.tsx           # /dashboard/projects/new — selector de paquetes + formulario
│   │       │   └── [id]/page.tsx          # /dashboard/projects/:id — detalle, propuestas, edición borrador
│   │       ├── proposals/page.tsx         # /dashboard/proposals — mis postulaciones
│   │       ├── contracts/page.tsx         # /dashboard/contracts — contratos activos
│   │       └── profile/page.tsx           # /dashboard/profile — edición inline de perfil
│   │
│   ├── projects/
│   │   ├── page.tsx              # /projects — explorar proyectos (público)
│   │   └── [id]/page.tsx         # /projects/:id — detalle + formulario de postulación
│   │
│   └── developers/
│       ├── page.tsx              # /developers — directorio público con filtros
│       └── [id]/page.tsx         # /developers/:id — perfil público estilo red social
│
├── components/
│   └── ui/
│       ├── navbar.tsx            # Navbar con dropdown de sesión + menú hamburguesa
│       ├── dev-card.tsx          # Tarjeta de developer (badges, stars, trust points)
│       └── avatar-picker.tsx     # Modal para subir foto o generar avatar (DiceBear)
│
├── hooks/
│   ├── use-profile.ts            # useMe(), useUpdateProfile()
│   ├── use-projects.ts           # useMyProjects(), usePublicProjects(), useProject(), useCreateProject(), useUpdateProject(), usePublishProject(), useAcceptProposal()
│   ├── use-proposals.ts          # useMyProposals(), useSubmitProposal(), useWithdrawProposal()
│   ├── use-developers.ts         # usePublicDevelopers(), useDeveloper()
│   └── use-upload.ts             # useUploadAvatar() — sube imagen al backend
│
├── schemas/
│   ├── project.schema.ts         # Zod schema para formulario de proyecto
│   └── proposal.schema.ts        # Zod schema para formulario de propuesta
│
├── lib/
│   ├── axios.ts                  # Cliente HTTP con interceptores JWT + manejo 401
│   ├── avatar.ts                 # defaultAvatar(name) → URL DiceBear
│   └── query-client.ts           # Instancia de TanStack Query
│
├── store/
│   └── auth.store.ts             # Zustand: { user, token, setAuth, logout, _hasHydrated }
│
└── types/
    └── index.ts                  # Interfaces TypeScript: User, Company, Developer, Project, Proposal, Contract, Milestone
```

---

## Responsive design

El layout se adapta a mobile y desktop:

| Contexto | Desktop (≥ lg) | Mobile (< lg) |
|----------|----------------|---------------|
| Dashboard | Sidebar fijo a la izquierda | Bottom tab bar fijo en la parte inferior |
| Navbar | Links visibles + dropdown de perfil | Botón hamburguesa → menú desplegable |
| Perfiles / proyectos | Layout de dos columnas | Una sola columna (preview primero o después según contexto) |

---

## Autenticación

### Estado global (Zustand)

```ts
// store/auth.store.ts
{
  user: { id, email, role } | null,
  token: string | null,
  _hasHydrated: boolean,
  setAuth(token, user): void,
  logout(): void,
}
```

El store se persiste en `localStorage` con el plugin `persist` de Zustand.

### Guard del dashboard

```tsx
// (dashboard)/layout.tsx
useEffect(() => {
  if (_hasHydrated && !user) router.push('/login');
}, [_hasHydrated, user, router]);
```

Espera la hidratación del store antes de redirigir, evitando el flash de redirección.

### Interceptor de Axios

`lib/axios.ts` adjunta el Bearer token en cada request y redirige a `/login` en 401 automáticamente. El hook `useMe()` usa `enabled: !!user` para no disparar la petición si el usuario no está autenticado — esto evita la redirección al login desde páginas públicas.

---

## Componentes clave

### `DevCard` (`components/ui/dev-card.tsx`)

Tarjeta reutilizable de developer. Usada en el directorio `/developers` y en la vista previa del perfil.

- Muestra: avatar (gradient o imagen), nombre, verificado, universidad, stars, trust points, skills, badges de especialidad, location, tarifa, garantía
- Con `id`: renderiza como `<Link>` navegable
- Sin `id`: renderiza como `<div>` (vista previa estática)
- Badges con tooltip `<Tip>` — z-index elevado para no ser cortados

### `AvatarPicker` (`components/ui/avatar-picker.tsx`)

Modal con dos pestañas:
- **Subir**: drag & drop + input de archivo, preview inmediato, sube al backend
- **Generar**: selector de estilo DiceBear, variaciones de seed, paleta de gradientes con iniciales

### `Navbar` (`components/ui/navbar.tsx`)

- Sin sesión: links "Iniciar sesión" + "Registrarse"
- Con sesión: botón Dashboard + dropdown (avatar + nombre + "Mi perfil" + "Cerrar sesión")
- Mobile: hamburguesa oculta/muestra los links de navegación

---

## Páginas disponibles

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing — hero, estadísticas, cómo funciona |
| `/login` | Público | Iniciar sesión |
| `/register` | Público | Registro con selección de rol (COMPANY / DEVELOPER) |
| `/projects` | Público | Explorar proyectos con filtros por categoría y búsqueda |
| `/projects/:id` | Público | Detalle de proyecto + formulario de postulación (developers) |
| `/developers` | Público | Directorio de developers con filtros por skill |
| `/developers/:id` | Público | Perfil público estilo red social (bio, skills, badges, trabajos) |
| `/dashboard` | Protegido | Overview con métricas por rol |
| `/dashboard/projects` | COMPANY | Lista de mis proyectos |
| `/dashboard/projects/new` | COMPANY | Crear proyecto (selector de paquetes + preview en tiempo real) |
| `/dashboard/projects/:id` | Ambos | Detalle: ver propuestas + aceptar (company) / editar borrador |
| `/dashboard/proposals` | DEVELOPER | Mis postulaciones con estado |
| `/dashboard/contracts` | Ambos | Contratos activos y milestones |
| `/dashboard/profile` | Ambos | Edición inline del perfil (campo a campo sin formulario completo) |

---

## Patrones de código

### Fetching de datos — TanStack Query

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['my-projects'],
  queryFn: () => api.get('/projects/my').then(r => r.data),
  enabled: !!user, // solo si hay sesión
})

const mutation = useMutation({
  mutationFn: (data) => api.post('/projects', data).then(r => r.data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-projects'] }),
})
```

### Formularios — React Hook Form + Zod

```tsx
// schemas/project.schema.ts
export const projectSchema = z.object({
  title: z.string().min(10, 'Mínimo 10 caracteres'),
  description: z.string().min(50, 'Mínimo 50 caracteres'),
  budget: z.coerce.number().min(1, 'Ingresa un presupuesto'),
  deadline: z.string().optional(),
  category: z.string().optional(),
});

// En el componente:
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(projectSchema)
})
```

### Generación de avatares por defecto

```ts
// lib/avatar.ts
export function defaultAvatar(name: string): string {
  const seed = encodeURIComponent(name || 'user');
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,...`;
}
```

Los avatares con gradiente se almacenan como `"gradient:from-blue-500:to-purple-600"` en `avatarUrl`.

---

## Scripts

```bash
npm run dev      # Servidor de desarrollo en http://localhost:3000
npm run build    # Build de producción
npm run start    # Servidor de producción (requiere build previo)
npm run lint     # ESLint
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL base de la API. En desarrollo: `http://localhost:3001/api` |
