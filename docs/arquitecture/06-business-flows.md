# 06 — Flujos de Negocio

Flujos end-to-end que muestran cómo interactúan los modelos en cada proceso clave.

---

## Flujo 1: Registro y onboarding

```
Actor: Nuevo usuario (COMPANY o DEVELOPER)

POST /api/auth/register
  body: { email, password, role: "COMPANY", name: "Acme Corp" }

Backend:
  1. Verifica que email no exista → User.findUnique({ email })
  2. Hash del password → bcrypt.hash(password, 10)
  3. Crea User + perfil en una transacción:
     ┌─ User.create({
     │    email, passwordHash, role: "COMPANY",
     │    company: { create: { name: "Acme Corp" } }
     │  })
     └─ Retorna { access_token, user: { id, email, role } }

DB resultante:
  User { id: "abc", email: "...", role: COMPANY }
  Company { id: "xyz", userId: "abc", name: "Acme Corp" }
```

---

## Flujo 2: Publicar un proyecto

```
Actor: COMPANY autenticada

POST /api/projects
  headers: Authorization: Bearer <token>
  body: { title, description, budget: 5000, skills: ["React", "Node.js"] }

Backend:
  1. JwtAuthGuard → valida token → obtiene User
  2. RolesGuard → verifica role === COMPANY
  3. Busca Company por userId → Company.findUnique({ userId: user.id })
  4. Crea proyecto en DRAFT:
     Project.create({ ...body, companyId: company.id, status: DRAFT })

PATCH /api/projects/:id/publish
  Backend:
    1. Verifica que project.companyId === company.id (autorización de recurso)
    2. Project.update({ status: OPEN })

DB resultante:
  Project { status: OPEN, companyId: "xyz" }
```

---

## Flujo 3: Postulación de un developer

```
Actor: DEVELOPER autenticado

POST /api/proposals/project/:projectId
  body: { coverLetter, budget: 4500, timeline: 30 }

Backend:
  1. JwtAuthGuard + RolesGuard (DEVELOPER)
  2. Busca Developer por userId
  3. Verifica que Project.status === OPEN
  4. Verifica que no exista propuesta previa:
     Proposal.findFirst({ projectId, developerId })
     → Si existe → lanza ConflictException (409)
  5. Proposal.create({ coverLetter, budget, timeline, projectId, developerId, status: PENDING })

DB resultante:
  Proposal { status: PENDING, projectId, developerId }
```

---

## Flujo 4: Aceptación de propuesta y creación de contrato

```
Actor: COMPANY autenticada

PATCH /api/proposals/:id/accept

Backend:
  1. JwtAuthGuard + RolesGuard (COMPANY)
  2. Busca propuesta con su proyecto y empresa
  3. Verifica que project.companyId === company.id
  4. Transacción:
     ┌─ a) Rechaza todas las demás propuestas del proyecto:
     │     Proposal.updateMany({
     │       where: { projectId, id: { not: proposalId } },
     │       data: { status: REJECTED }
     │     })
     │
     ├─ b) Acepta la propuesta seleccionada:
     │     Proposal.update({ id, data: { status: ACCEPTED } })
     │
     ├─ c) Cambia el proyecto a IN_PROGRESS:
     │     Project.update({ id: projectId, data: { status: IN_PROGRESS } })
     │
     └─ d) Crea el contrato con milestone inicial:
           Contract.create({
             projectId,
             milestones: {
               create: [{
                 title: "Entrega completa",
                 amount: proposal.budget,
                 order: 1,
                 status: PENDING
               }]
             }
           })

DB resultante:
  Proposal { status: ACCEPTED }
  Proposal[] { status: REJECTED }  ← todas las demás
  Project { status: IN_PROGRESS }
  Contract { status: ACTIVE, projectId }
  Milestone { status: PENDING, amount: 4500, order: 1 }
```

---

## Flujo 5: Ciclo completo de un milestone (post-aceptación)

```
1. DEVELOPER → Iniciar milestone

   PATCH /api/contracts/:id/milestones/:milestoneId/start
   Backend:
     1. Verifica que el developer es parte del contrato (propuesta ACCEPTED)
     2. Verifica que milestone.status === PENDING
     3. Milestone.update({ status: IN_PROGRESS, startedAt: now() })
     4. Notifica a COMPANY: MILESTONE_STARTED

   DB: Milestone { status: IN_PROGRESS, startedAt: "..." }

──────────────────────────────────────────────

2. DEVELOPER → Entregar milestone

   PATCH /api/contracts/:id/milestones/:milestoneId/submit
   body: { deliveryNote: "Aquí el link al staging...", deliveryLink: "https://..." }
   Backend:
     1. Verifica que el developer es parte del contrato
     2. Verifica que milestone.status IN [IN_PROGRESS, REVISION_REQUESTED]
     3. Milestone.update({
          status: SUBMITTED,
          deliveryNote, deliveryLink,
          submittedAt: now()
        })
     4. Notifica a COMPANY: MILESTONE_SUBMITTED

   DB: Milestone { status: SUBMITTED, deliveryNote: "...", deliveryLink: "...", submittedAt: "..." }

──────────────────────────────────────────────

3a. COMPANY → Pedir revisión (ciclo de revisión)

   PATCH /api/contracts/:id/milestones/:milestoneId/request-revision
   body: { reason: "Falta la pantalla de login" }
   Backend:
     1. Verifica que la empresa es dueña del proyecto
     2. Verifica que milestone.status === SUBMITTED
     3. Milestone.update({ status: REVISION_REQUESTED })
     4. Notifica a DEVELOPER: MILESTONE_REVISION_REQUESTED con el motivo

   DB: Milestone { status: REVISION_REQUESTED }
   → DEVELOPER vuelve al paso 2 ("Volver a entregar")

──────────────────────────────────────────────

3b. COMPANY → Aprobar milestone

   PATCH /api/contracts/:id/milestones/:milestoneId/approve
   Backend:
     1. Verifica que la empresa es dueña del proyecto
     2. Verifica que milestone.status === SUBMITTED
     3. Milestone.update({ status: PAID })         ← SUBMITTED → PAID directamente
     4. Notifica a DEVELOPER: MILESTONE_PAID
     5. Si TODOS los milestones del contrato están en PAID:
        Contract.update({ status: COMPLETED })
        Project.update({ status: COMPLETED })
        Notifica a COMPANY: CONTRACT_COMPLETED
        Notifica a DEVELOPER: CONTRACT_COMPLETED

   DB resultante (milestone final):
     Milestone { status: PAID }
     Contract { status: COMPLETED }  ← si era el último
     Project { status: COMPLETED }   ← si era el último
```

---

## Flujo 6: Cálculo de comisión de la plataforma

```
Ejemplo:
  Proposal.budget     = $4,500
  Contract.platformFee = 10%

  Pago bruto al developer:  $4,500
  Comisión plataforma:      $4,500 × 10% = $450
  Pago neto al developer:   $4,500 - $450 = $4,050
  Ingreso plataforma:       $450
```

La `platformFee` se almacena en el contrato al momento de su creación, por lo que cambios futuros en la comisión global no afectan contratos existentes.

---

## Resumen de actores por endpoint crítico

| Acción | Actor | Validaciones |
|--------|-------|--------------|
| Crear proyecto | COMPANY | Token válido + rol COMPANY |
| Publicar proyecto | COMPANY | Token + rol + es dueño del proyecto |
| Postular | DEVELOPER | Token + rol + proyecto OPEN + no ha postulado antes |
| Aceptar propuesta | COMPANY | Token + rol + es dueño del proyecto |
| Retirar propuesta | DEVELOPER | Token + rol + es autor de la propuesta + estado PENDING |
| Iniciar milestone | DEVELOPER | Token + es parte del contrato + milestone PENDING |
| Entregar milestone | DEVELOPER | Token + es parte del contrato + milestone IN_PROGRESS o REVISION_REQUESTED |
| Aprobar milestone | COMPANY | Token + es dueña del proyecto del contrato + milestone SUBMITTED |
| Pedir revisión | COMPANY | Token + es dueña del proyecto del contrato + milestone SUBMITTED |

---

## Flujo 7: Sistema de disputas

```
Actor: Cualquiera de las partes del contrato (COMPANY o DEVELOPER)

POST /api/contracts/:id/dispute
  body: { reason: "El developer desapareció hace 3 semanas" }
  header: Authorization: Bearer <token>

Backend (ContractsService.openDispute):
  1. Verifica que el usuario sea parte del contrato (company.userId o developer.userId)
  2. Verifica contract.status === 'ACTIVE'
  3. contract.update({ status: 'DISPUTED', disputeReason, disputeOpenedById })
  4. Crea notificación para la otra parte: type='DISPUTE_OPENED'
  5. Busca todos los User con role='ADMIN' → crea notificación para cada uno
  6. Postea ChatMessage de tipo EVENT: { action: 'DISPUTE_OPENED', reason }

Frontend:
  - Banner rojo aparece en /dashboard/contracts/:id
  - Acciones de milestone quedan bloqueadas
  - Admin ve la disputa en /dashboard/admin → pestaña "Disputas"

PATCH /api/contracts/:id/resolve   (solo ADMIN)
  body: { outcome: 'dev_wins' | 'company_wins' | 'mutual' }

Backend (ContractsService.resolveDispute):
  dev_wins:
    - Milestones SUBMITTED → PAID (doApproveMilestone interno)
    - Si todos PAID → contract.status = 'COMPLETED', project.status = 'COMPLETED'
    - Si no → contract.status = 'ACTIVE'
  company_wins:
    - contract.status = 'CANCELLED'
    - developer.trustPoints = Math.max(0, trustPoints - 15)
  mutual:
    - contract.status = 'CANCELLED'
  - Notifica a ambas partes: type='DISPUTE_RESOLVED'
  - EVENT en chat: { action: 'DISPUTE_RESOLVED', outcome }
```

---

## Flujo 8: Cancelación mutua

```
Actor: Cualquiera de las partes

1. Parte A propone cancelar:
   POST /api/contracts/:id/propose
     body: { milestoneId: '', action: 'PROPOSE_CANCEL' }
   → ChatMessage tipo PROPOSAL se postea en el chat del contrato

2. Parte B ve la propuesta en el chat y acepta:
   POST /api/contracts/:id/respond
     body: { messageId, accept: true }

3. Backend detecta action='PROPOSE_CANCEL':
   → contract.status = 'CANCELLED'
   → EVENT en chat: { action: 'CONTRACT_CANCELLED_MUTUAL' }
   → Notificación a ambas partes
   → Banner gris aparece en la UI
```

---

## Flujo 9: Auto-aprobación de milestone (7 días)

```
Actor: DEVELOPER

Condición: milestone.status === 'SUBMITTED' && Date.now() - milestone.submittedAt > 7 días

1. Frontend muestra botón "Aprobación automática disponible (7 días sin respuesta)"
   en MilestoneStep cuando se cumple la condición.

2. Developer confirma en modal:
   POST /api/contracts/:id/milestones/:milestoneId/force-approve

3. Backend (ContractsService.forceApprove):
   - Verifica que el caller sea el developer del contrato
   - Verifica milestone.status === 'SUBMITTED'
   - Verifica Date.now() - submittedAt > 7 * 24 * 60 * 60 * 1000
   - Llama internamente a doApproveMilestone(contractId, milestoneId, company.userId)
     → milestone.status = 'PAID'
     → Si todos los milestones son PAID → contract.status = 'COMPLETED'

4. Frontend invalida ['contract', contractId] y muestra toast de éxito.
```

---

## Flujo 10: Guard de queries por rol

```
Problema: GET /api/projects/my requiere rol COMPANY (403 para DEVELOPER).
          React Query con retry=3 generaba un loop de 3 peticiones 403.

Solución aplicada:

// hooks/use-projects.ts
export function useMyProjects(enabled = true) {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: () => api.get('/projects/my').then(r => r.data),
    enabled,      // solo ejecuta si es true
    retry: false, // no reintentar en 403
  });
}

// En cada componente:
const isCompany = user?.role === 'COMPANY';
const { data } = useMyProjects(isCompany); // no-op para DEVELOPER

Archivos corregidos:
  - app/(dashboard)/dashboard/page.tsx
  - features/projects/components/DashboardProjectsPage.tsx
  - app/(dashboard)/dashboard/contracts/page.tsx
```
