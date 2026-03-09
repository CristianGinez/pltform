const path = require('path');
const root = path.join(__dirname, '..', '..');

// Cuando se corre localmente con `railway run`, usar la URL pública
if (process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
}
const { PrismaClient } = require(path.join(root, 'backend', 'node_modules', '@prisma', 'client'));
const bcrypt = require(path.join(root, 'node_modules', 'bcryptjs'));

const EMAIL    = process.argv[2] || 'admin@ejemplo.com';
const PASSWORD = process.argv[3] || 'Admin123456!';

const prisma = new PrismaClient();

bcrypt.hash(PASSWORD, 10)
  .then(h => prisma.user.create({ data: { email: EMAIL, passwordHash: h, role: 'ADMIN' } }))
  .then(u => console.log('Admin creado:', u.email))
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
