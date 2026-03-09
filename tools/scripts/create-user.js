#!/usr/bin/env node

/**
 * CLI para crear usuarios en la plataforma
 * Uso: node tools/scripts/create-user.js
 * npm run users:create
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ─── Cargar .env del backend ─────────────────────────────────────────────────

const envPath = path.join(__dirname, '../../backend/.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) process.env[key] = val;
    });
} else {
  console.error('No se encontró backend/.env. Asegúrate de crearlo primero.');
  process.exit(1);
}

// ─── Imports (después de cargar env) ─────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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

const ROLES = ['COMPANY', 'DEVELOPER', 'ADMIN'];

const ROLE_DESC = {
  COMPANY:   'Empresa que publica proyectos',
  DEVELOPER: 'Desarrollador que postula a proyectos',
  ADMIN:     'Administrador de la plataforma',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const askHidden = (prompt) =>
  new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0008' || char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });

function divider(char = '─', len = 44) {
  return c.gray + char.repeat(len) + c.reset;
}

function printHeader() {
  console.clear();
  console.log('\n' + divider('═'));
  console.log(`${c.bold}${c.blue}   pltform${c.reset} ${c.gray}·${c.reset} ${c.white}Gestión de usuarios${c.reset}`);
  console.log(divider('═'));
}

function printSuccess(user, profile) {
  console.log('\n' + divider());
  console.log(`${c.green}${c.bold}  ✓ Usuario creado exitosamente${c.reset}`);
  console.log(divider());
  console.log(`  ${c.gray}ID:${c.reset}     ${c.cyan}${user.id}${c.reset}`);
  console.log(`  ${c.gray}Rol:${c.reset}    ${c.cyan}${user.role}${c.reset}`);
  console.log(`  ${c.gray}Email:${c.reset}  ${c.cyan}${user.email}${c.reset}`);
  if (profile) {
    console.log(`  ${c.gray}Nombre:${c.reset} ${c.cyan}${profile.name}${c.reset}`);
  }
  console.log(divider());
}

function printError(msg) {
  console.log(`\n  ${c.red}✗ ${msg}${c.reset}\n`);
}

// ─── Selección de rol ─────────────────────────────────────────────────────────

async function selectRole() {
  console.log(`\n${c.bold}  Selecciona el rol:${c.reset}\n`);
  ROLES.forEach((role, i) => {
    console.log(
      `  ${c.cyan}${c.bold}[${i + 1}]${c.reset} ${c.white}${role}${c.reset}  ${c.gray}${ROLE_DESC[role]}${c.reset}`,
    );
  });
  console.log();

  const input = await ask(`  Opción (1-${ROLES.length}): `);
  const idx = parseInt(input, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= ROLES.length) {
    printError('Opción inválida.');
    return selectRole();
  }
  return ROLES[idx];
}

// ─── Crear un usuario ─────────────────────────────────────────────────────────

async function createUser() {
  printHeader();

  const role = await selectRole();
  const label = role === 'COMPANY' ? 'nombre de la empresa' : 'tu nombre completo';

  console.log(`\n${c.bold}  Datos del nuevo ${c.cyan}${role}${c.reset}${c.bold}:${c.reset}\n`);

  const name     = (await ask(`  ${label.charAt(0).toUpperCase() + label.slice(1)}: `)).trim();
  const email    = (await ask('  Email: ')).trim().toLowerCase();
  const password = await askHidden('  Contraseña (mín. 8 caracteres): ');

  // Validaciones
  const errors = [];
  if (!name || name.length < 2)           errors.push('El nombre debe tener al menos 2 caracteres.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido.');
  if (!password || password.length < 8)   errors.push('La contraseña debe tener al menos 8 caracteres.');

  if (errors.length) {
    errors.forEach((e) => printError(e));
    const retry = await ask('\n  ¿Intentar de nuevo? (s/N): ');
    if (retry.toLowerCase() === 's') return createUser();
    return finish();
  }

  console.log(`\n  ${c.gray}Creando usuario...${c.reset}`);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      printError(`El email ${c.cyan}${email}${c.red} ya está registrado.`);
      const retry = await ask('  ¿Intentar con otro email? (s/N): ');
      if (retry.toLowerCase() === 's') return createUser();
      return finish();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      email,
      passwordHash,
      role,
    };

    if (role === 'COMPANY') {
      userData.company = { create: { name } };
    } else if (role === 'DEVELOPER') {
      userData.developer = { create: { name } };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { company: true, developer: true },
    });

    const profile = user.company ?? user.developer ?? null;
    printSuccess(user, profile);

  } catch (err) {
    printError(`Error inesperado: ${err.message}`);
  }

  const another = await ask('\n  ¿Crear otro usuario? (s/N): ');
  if (another.toLowerCase() === 's') return createUser();
  finish();
}

// ─── Listar usuarios existentes ───────────────────────────────────────────────

async function listUsers() {
  printHeader();
  console.log(`\n${c.bold}  Usuarios registrados:${c.reset}\n`);

  const users = await prisma.user.findMany({
    include: { company: true, developer: true },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log(`  ${c.gray}No hay usuarios aún.${c.reset}`);
  } else {
    const roleColors = { COMPANY: c.blue, DEVELOPER: c.green, ADMIN: c.yellow };
    users.forEach((u) => {
      const profile = u.company ?? u.developer;
      const name = profile?.name ?? '—';
      const col = roleColors[u.role] ?? c.white;
      console.log(
        `  ${c.gray}${u.id.slice(-8)}${c.reset}  ${col}${u.role.padEnd(10)}${c.reset}  ${c.cyan}${u.email.padEnd(30)}${c.reset}  ${name}`,
      );
    });
  }

  console.log('\n' + divider());
  const back = await ask('\n  Presiona Enter para volver al menú...');
  return mainMenu();
}

// ─── Menú principal ───────────────────────────────────────────────────────────

async function mainMenu() {
  printHeader();

  const options = [
    { label: 'Crear usuario',       fn: createUser },
    { label: 'Listar usuarios',     fn: listUsers  },
    { label: 'Salir',               fn: finish     },
  ];

  console.log(`\n${c.bold}  Opciones:${c.reset}\n`);
  options.forEach((opt, i) => {
    console.log(`  ${c.cyan}${c.bold}[${i + 1}]${c.reset} ${c.white}${opt.label}${c.reset}`);
  });
  console.log();

  const input = await ask(`  Opción (1-${options.length}): `);
  const idx = parseInt(input, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= options.length) {
    printError('Opción inválida.');
    return mainMenu();
  }

  await options[idx].fn();
}

// ─── Salir ────────────────────────────────────────────────────────────────────

async function finish() {
  console.log(`\n  ${c.gray}Hasta luego.${c.reset}\n`);
  rl.close();
  await prisma.$disconnect();
  process.exit(0);
}

// ─── Arrancar ─────────────────────────────────────────────────────────────────

mainMenu().catch(async (err) => {
  console.error(`\n${c.red}Error fatal: ${err.message}${c.reset}\n`);
  await prisma.$disconnect();
  process.exit(1);
});
