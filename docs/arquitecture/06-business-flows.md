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

## Flujo 5: Entrega y aprobación de milestone

```
Actor: DEVELOPER → entrega trabajo

PATCH /api/contracts/:id/milestones/:milestoneId/submit
  Backend:
    1. Verifica que el developer es parte del contrato
    2. Milestone.update({ status: SUBMITTED })

Actor: COMPANY → revisa y aprueba

PATCH /api/contracts/:id/milestones/:milestoneId/approve
  Backend:
    1. Verifica que la empresa es dueña del proyecto
    2. Milestone.update({ status: APPROVED })

  [Fase 2 — Stripe]:
    3. Procesa pago al developer (descontando platformFee)
    4. Milestone.update({ status: PAID })
    5. Si todos los milestones están PAID:
       Contract.update({ status: COMPLETED })
       Project.update({ status: COMPLETED })

DB resultante:
  Milestone { status: PAID }
  Contract { status: COMPLETED }  ← si era el último milestone
  Project { status: COMPLETED }   ← si era el último milestone
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
| Entregar milestone | DEVELOPER | Token + es parte del contrato |
| Aprobar milestone | COMPANY | Token + es dueña del proyecto del contrato |
