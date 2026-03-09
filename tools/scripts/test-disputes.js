#!/usr/bin/env node

/**
 * Script de prueba end-to-end para el sistema de disputas y cancelación mutua.
 * Llama a la API real en localhost:3001 — el backend debe estar corriendo.
 *
 * Escenarios que prueba:
 *  1. Setup     → crea empresa, developer, admin, proyecto, propuesta, contrato, milestones
 *  2. Disputa #1 → empresa abre disputa → admin resuelve a favor del developer (dev_wins)
 *  3. Disputa #2 → developer abre disputa → admin resuelve a favor de la empresa (company_wins, -15 tp)
 *  4. Disputa #3 → empresa abre disputa → admin resuelve como mutuo (mutual)
 *  5. Force Approve → milestone entregado hace 8 días → developer fuerza aprobación
 *  6. Propose Cancel → empresa propone cancelar → developer acepta
 *
 * IMPORTANTE: cada escenario 2-6 crea su propio contrato limpio.
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const root = path.join(__dirname, '..', '..');

// ─── Cargar .env del backend ──────────────────────────────────────────────────

const envPath = path.join(root, 'backend', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k) process.env[k] = v;
  });
}

const { PrismaClient } = require(path.join(root, 'node_modules', '@prisma', 'client'));
const bcrypt           = require(path.join(root, 'node_modules', 'bcryptjs'));
const prisma           = new PrismaClient();

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = `http://localhost:${process.env.PORT ?? 3001}/api`;

const TEST_COMPANY   = { email: 'test-empresa@disputes.local',   password: 'Test1234!', role: 'COMPANY',   name: 'Empresa Test Disputas' };
const TEST_DEV       = { email: 'test-dev@disputes.local',       password: 'Test1234!', role: 'DEVELOPER', name: 'Developer Test Disputas' };
const TEST_ADMIN     = { email: 'test-admin@disputes.local',     password: 'Test1234!' };

// ─── Colores ANSI ─────────────────────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function log(msg)  { console.log(`  ${msg}`); }
function ok(msg)   { passCount++; console.log(`  ${c.green}✓${c.reset} ${msg}`); }
function fail(msg) { failCount++; console.log(`  ${c.red}✗ ${msg}${c.reset}`); }
function section(title) {
  console.log(`\n${c.bold}${c.cyan}── ${title} ${c.gray}${'─'.repeat(Math.max(0, 44 - title.length))}${c.reset}`);
}
function divider() {
  console.log(`${c.gray}${'─'.repeat(48)}${c.reset}`);
}

async function api(method, endpoint, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    throw Object.assign(new Error(data?.message ?? `HTTP ${res.status}`), { status: res.status, data });
  }
  return data;
}

async function login(email, password) {
  const data = await api('POST', '/auth/login', { email, password });
  return data.access_token;
}

// ─── Setup: crear usuarios de test ───────────────────────────────────────────

async function ensureUsers() {
  section('Setup — Usuarios de test');

  // Admin via Prisma (no hay endpoint público de registro para admins)
  const existingAdmin = await prisma.user.findUnique({ where: { email: TEST_ADMIN.email } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(TEST_ADMIN.password, 10);
    await prisma.user.create({ data: { email: TEST_ADMIN.email, passwordHash: hash, role: 'ADMIN' } });
    ok(`Admin creado: ${TEST_ADMIN.email}`);
  } else {
    ok(`Admin ya existe: ${TEST_ADMIN.email}`);
  }

  // Empresa y Developer via API
  for (const u of [TEST_COMPANY, TEST_DEV]) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await api('POST', '/auth/register', { email: u.email, password: u.password, role: u.role, name: u.name });
      ok(`${u.role} creado: ${u.email}`);
    } else {
      ok(`${u.role} ya existe: ${u.email}`);
    }
  }
}

// ─── Setup: crear contrato con milestones ─────────────────────────────────────

async function createContract(companyToken, devToken, label = '') {
  // 1. Crear proyecto
  const project = await api('POST', '/projects', {
    title:       `Proyecto ${label} ${Date.now()}`,
    description: 'Proyecto de prueba para el sistema de disputas y cancelación mutua de contratos en la plataforma.',
    budget:      1000,
    skills:      ['Node.js'],
    category:    'Backend',
  }, companyToken);

  // 2. Publicar proyecto
  await api('PATCH', `/projects/${project.id}/publish`, {}, companyToken);

  // 3. Developer postula
  const proposal = await api('POST', `/proposals/project/${project.id}`, {
    coverLetter: 'Propuesta de prueba generada automáticamente por el script de test del sistema de disputas. Tengo experiencia en el área y puedo entregar el proyecto en el tiempo acordado con alta calidad.',
    budget:      900,
    timeline:    14,
  }, devToken);

  // 4. Empresa acepta → crea contrato (milestones generados automáticamente)
  const accepted = await api('PATCH', `/proposals/${proposal.id}/accept`, {}, companyToken);

  // findById del contrato
  const contractId = accepted.contractId ?? accepted.id;
  const contract = await api('GET', `/contracts/${contractId}`, null, companyToken);
  return contract;
}

// ─── Escenario 1: dev_wins ────────────────────────────────────────────────────

async function testDevWins(companyToken, devToken, adminToken) {
  section('Escenario 1 — Disputa → dev_wins');

  const contract = await createContract(companyToken, devToken, 'dev_wins');
  const m1 = contract.milestones[0];

  // Developer inicia y entrega milestone
  await api('PATCH', `/contracts/${contract.id}/milestones/${m1.id}/start`,  {}, devToken);
  await api('PATCH', `/contracts/${contract.id}/milestones/${m1.id}/submit`, { deliveryNote: 'Entrega lista' }, devToken);

  // Empresa abre disputa
  await api('POST', `/contracts/${contract.id}/dispute`, { reason: 'El developer entregó trabajo incompleto y no responde' }, companyToken);

  // Verificar estado DISPUTED
  const disputed = await api('GET', `/contracts/${contract.id}`, null, companyToken);
  if (disputed.status === 'DISPUTED') ok('Contrato pasó a DISPUTED');
  else fail(`Estado esperado DISPUTED, obtenido: ${disputed.status}`);

  if (disputed.disputeReason?.length > 0) ok(`disputeReason guardado: "${disputed.disputeReason}"`);
  else fail('disputeReason no guardado');

  // Admin resuelve a favor del developer
  await api('PATCH', `/contracts/${contract.id}/resolve`, { outcome: 'dev_wins' }, adminToken);

  const resolved = await api('GET', `/contracts/${contract.id}`, null, companyToken);
  const m1Final = resolved.milestones.find((m) => m.id === m1.id);

  if (m1Final?.status === 'PAID') ok('Milestone SUBMITTED → PAID (dev_wins)');
  else fail(`Milestone status: ${m1Final?.status} (esperado PAID)`);

  // Solo 1 de 2 milestones pagado → contrato debe quedar ACTIVE
  if (resolved.status === 'ACTIVE') ok('Contrato vuelve a ACTIVE (milestones pendientes)');
  else fail(`Estado del contrato: ${resolved.status} (esperado ACTIVE)`);
}

// ─── Escenario 2: company_wins (-15 trustPoints) ──────────────────────────────

async function testCompanyWins(companyToken, devToken, adminToken) {
  section('Escenario 2 — Disputa → company_wins (−15 trustPoints)');

  // Obtener trustPoints iniciales del developer
  const devProfile = await api('GET', '/auth/me', null, devToken);
  const devUserId  = devProfile.id;
  const devBefore  = await prisma.developer.findUnique({ where: { userId: devUserId }, select: { trustPoints: true } });
  const tpBefore   = devBefore?.trustPoints ?? 0;
  log(`TrustPoints antes: ${c.yellow}${tpBefore}${c.reset}`);

  const contract = await createContract(companyToken, devToken, 'company_wins');

  // Developer abre disputa
  await api('POST', `/contracts/${contract.id}/dispute`, { reason: 'La empresa no paga y no responde a mis mensajes' }, devToken);

  const disputed = await api('GET', `/contracts/${contract.id}`, null, devToken);
  if (disputed.status === 'DISPUTED') ok('Contrato en DISPUTED');
  else fail(`Estado: ${disputed.status}`);

  // Admin resuelve a favor de la empresa
  await api('PATCH', `/contracts/${contract.id}/resolve`, { outcome: 'company_wins' }, adminToken);

  const resolved = await api('GET', `/contracts/${contract.id}`, null, companyToken);
  if (resolved.status === 'CANCELLED') ok('Contrato CANCELLED (company_wins)');
  else fail(`Estado: ${resolved.status} (esperado CANCELLED)`);

  // Verificar deducción de trustPoints
  const devAfter = await prisma.developer.findUnique({ where: { userId: devUserId }, select: { trustPoints: true } });
  const tpAfter  = devAfter?.trustPoints ?? 0;
  const expected = Math.max(0, tpBefore - 15);

  log(`TrustPoints después: ${c.yellow}${tpAfter}${c.reset} (esperado: ${expected})`);
  if (tpAfter === expected) ok(`TrustPoints reducidos correctamente: ${tpBefore} → ${tpAfter}`);
  else fail(`TrustPoints: ${tpAfter} (esperado: ${expected})`);
}

// ─── Escenario 3: mutual ──────────────────────────────────────────────────────

async function testMutual(companyToken, devToken, adminToken) {
  section('Escenario 3 — Disputa → cancelación mutua (mutual)');

  const contract = await createContract(companyToken, devToken, 'mutual');

  await api('POST', `/contracts/${contract.id}/dispute`, { reason: 'Ambas partes acordaron terminar el proyecto' }, companyToken);

  await api('PATCH', `/contracts/${contract.id}/resolve`, { outcome: 'mutual' }, adminToken);

  const resolved = await api('GET', `/contracts/${contract.id}`, null, companyToken);
  if (resolved.status === 'CANCELLED') ok('Contrato CANCELLED (mutual)');
  else fail(`Estado: ${resolved.status}`);
}

// ─── Escenario 4: force-approve (>7 días) ────────────────────────────────────

async function testForceApprove(companyToken, devToken) {
  section('Escenario 4 — Force Approve (submittedAt > 7 días)');

  const contract = await createContract(companyToken, devToken, 'force-approve');
  const m1 = contract.milestones[0];

  // Developer inicia y entrega
  await api('PATCH', `/contracts/${contract.id}/milestones/${m1.id}/start`,  {}, devToken);
  await api('PATCH', `/contracts/${contract.id}/milestones/${m1.id}/submit`, { deliveryNote: 'Todo listo' }, devToken);

  // Verificar que sin 7 días falla
  try {
    await api('POST', `/contracts/${contract.id}/milestones/${m1.id}/force-approve`, {}, devToken);
    fail('Debería haber fallado (aún dentro del plazo)');
  } catch (err) {
    if (err.status === 400) ok(`Rechazado correctamente antes de 7 días: "${err.message}"`);
    else fail(`Error inesperado: ${err.message}`);
  }

  // Simular que han pasado 8 días modificando submittedAt en DB
  await prisma.milestone.update({
    where: { id: m1.id },
    data:  { submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
  });
  ok('submittedAt puesto a hace 8 días vía Prisma');

  // Ahora sí debería funcionar
  await api('POST', `/contracts/${contract.id}/milestones/${m1.id}/force-approve`, {}, devToken);

  const updated = await api('GET', `/contracts/${contract.id}`, null, devToken);
  const m1Final = updated.milestones.find((m) => m.id === m1.id);

  if (m1Final?.status === 'PAID') ok('Milestone forzado a PAID exitosamente');
  else fail(`Milestone status: ${m1Final?.status} (esperado PAID)`);
}

// ─── Escenario 5: propose-cancel → aceptar ───────────────────────────────────

async function testProposeCancel(companyToken, devToken) {
  section('Escenario 5 — Propose Cancel → aceptar (cancelación mutua)');

  const contract = await createContract(companyToken, devToken, 'propose-cancel');

  // Empresa propone cancelar
  await api('POST', `/contracts/${contract.id}/propose-cancel`, {}, companyToken);
  ok('Propuesta de cancelación enviada por la empresa');

  // Obtener el mensaje PROPOSE_CANCEL del chat
  const messages = await api('GET', `/contracts/${contract.id}/messages`, null, devToken);
  const proposal = messages.find((m) => m.type === 'PROPOSAL' && m.metadata?.action === 'PROPOSE_CANCEL');

  if (!proposal) {
    fail('No se encontró mensaje PROPOSE_CANCEL en el chat');
    return;
  }
  ok(`Mensaje PROPOSE_CANCEL en chat: id=${proposal.id}`);

  // Developer acepta
  await api('POST', `/contracts/${contract.id}/proposals/${proposal.id}/respond`, { response: 'accept' }, devToken);

  const updated = await api('GET', `/contracts/${contract.id}`, null, devToken);
  if (updated.status === 'CANCELLED') ok('Contrato CANCELLED por acuerdo mutuo');
  else fail(`Estado: ${updated.status} (esperado CANCELLED)`);

  // Verificar que hay evento CONTRACT_CANCELLED_MUTUAL en el chat
  const msgs2 = await api('GET', `/contracts/${contract.id}/messages`, null, devToken);
  const event = msgs2.find((m) => m.type === 'EVENT' && m.metadata?.action === 'CONTRACT_CANCELLED_MUTUAL');
  if (event) ok('Evento CONTRACT_CANCELLED_MUTUAL registrado en el chat');
  else fail('No se encontró evento CONTRACT_CANCELLED_MUTUAL');
}

// ─── Escenario 6: getDisputedContracts (admin) ───────────────────────────────

async function testGetDisputed(companyToken, devToken, adminToken) {
  section('Escenario 6 — GET /contracts/disputed (admin only)');

  const contract = await createContract(companyToken, devToken, 'list-disputed');
  await api('POST', `/contracts/${contract.id}/dispute`, { reason: 'Prueba de listado de disputas activas' }, companyToken);

  const disputes = await api('GET', '/contracts/disputed', null, adminToken);
  const found = disputes.find((d) => d.id === contract.id);

  if (found) ok(`Contrato encontrado en /contracts/disputed (${disputes.length} total)`);
  else fail('Contrato no aparece en /contracts/disputed');

  // Verificar que sin token de admin falla
  try {
    await api('GET', '/contracts/disputed', null, companyToken);
    fail('Debería haber rechazado acceso a empresa');
  } catch (err) {
    if (err.status === 403) ok('Acceso denegado correctamente para no-admin (403)');
    else fail(`Error inesperado: ${err.status} ${err.message}`);
  }
}

// ─── Limpieza ─────────────────────────────────────────────────────────────────

async function cleanup() {
  section('Limpieza — eliminar datos de test');

  const emails = [TEST_COMPANY.email, TEST_DEV.email, TEST_ADMIN.email];

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;

    // Eliminar contratos → milestones/mensajes en cascada
    const companyOrDev = user.role === 'COMPANY'
      ? await prisma.company.findUnique({ where: { userId: user.id }, include: { projects: { include: { contract: true } } } })
      : null;

    if (companyOrDev) {
      for (const project of companyOrDev.projects ?? []) {
        if (project.contract) {
          await prisma.contract.delete({ where: { id: project.contract.id } }).catch(() => {});
        }
        await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
      }
    }

    await prisma.user.delete({ where: { email } }).catch(() => {});
    ok(`Eliminado: ${email}`);
  }
}

// ─── Runner principal ─────────────────────────────────────────────────────────

async function main() {
  console.clear();
  console.log(`\n${c.bold}${'═'.repeat(50)}${c.reset}`);
  console.log(`${c.bold}${c.blue}  pltform${c.reset} ${c.gray}·${c.reset} ${c.white}Test: Sistema de Disputas${c.reset}`);
  console.log(`${c.bold}${'═'.repeat(50)}${c.reset}`);
  console.log(`${c.gray}  API: ${BASE_URL}${c.reset}\n`);

  // Verificar que el backend está activo
  try {
    await fetch(`${BASE_URL}/auth/me`);
  } catch {
    console.log(`\n  ${c.red}✗ No se puede conectar a ${BASE_URL}${c.reset}`);
    console.log(`  ${c.yellow}Asegúrate de que el backend esté corriendo (npm run dev:backend)${c.reset}\n`);
    process.exit(1);
  }

  try {
    await ensureUsers();

    const companyToken = await login(TEST_COMPANY.email, TEST_COMPANY.password);
    const devToken     = await login(TEST_DEV.email,     TEST_DEV.password);
    const adminToken   = await login(TEST_ADMIN.email,   TEST_ADMIN.password);
    ok('Tokens obtenidos para los 3 roles');

    await testDevWins(companyToken, devToken, adminToken);
    await testCompanyWins(companyToken, devToken, adminToken);
    await testMutual(companyToken, devToken, adminToken);
    await testForceApprove(companyToken, devToken);
    await testProposeCancel(companyToken, devToken);
    await testGetDisputed(companyToken, devToken, adminToken);

  } catch (err) {
    console.log(`\n  ${c.red}${c.bold}Error fatal: ${err.message}${c.reset}`);
    if (err.data) console.log(`  ${c.gray}${JSON.stringify(err.data)}${c.reset}`);
    failCount++;
  }

  // ─── Resumen ───────────────────────────────────────────────────────────────

  section('Resumen');
  divider();
  console.log(`  ${c.green}${c.bold}Pasados: ${passCount}${c.reset}`);
  if (failCount > 0) console.log(`  ${c.red}${c.bold}Fallados: ${failCount}${c.reset}`);
  else console.log(`  ${c.gray}Fallados: 0${c.reset}`);
  divider();

  // Preguntar si limpiar
  const args = process.argv.slice(2);
  if (args.includes('--clean') || args.includes('-c')) {
    await cleanup();
  } else {
    console.log(`\n  ${c.gray}Tip: pasa ${c.cyan}--clean${c.gray} para eliminar los datos de test${c.reset}`);
    console.log(`  ${c.gray}     node tools/scripts/test-disputes.js --clean${c.reset}\n`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// ─────────────────────────────────────────────────────────────────────────────
//
//  CÓMO EJECUTARLO
//  ───────────────
//  Prerrequisito: el backend debe estar corriendo en localhost:3001
//
//    # 1. Levantar el backend (si no está corriendo)
//    npm run dev:backend
//
//    # 2. Desde la raíz del proyecto, en otra terminal:
//    node tools/scripts/test-disputes.js
//
//    # 3. Para limpiar los usuarios y contratos de test al terminar:
//    node tools/scripts/test-disputes.js --clean
//
//  O con el script de npm (agregar a package.json si quieres):
//    "test:disputes": "node tools/scripts/test-disputes.js --clean"
//
// ─────────────────────────────────────────────────────────────────────────────
