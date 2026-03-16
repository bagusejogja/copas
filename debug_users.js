const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, unit: true }
  });
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    nama: u.nama,
    role_id: u.role_id,
    role: u.role.nama_jabatan,
    unit_id: u.unit_id,
    unit: u.unit?.nama_unit
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
