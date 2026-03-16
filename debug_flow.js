const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const flows = await prisma.approvalFlow.findMany({ include: { role: true } });
  const roles = await prisma.role.findMany();
  console.log('--- FLOWS ---');
  flows.forEach(f => console.log(`Step ${f.urutan}: Role ${f.role.nama_jabatan} (ID: ${f.role_id}, Level: ${f.role.level})`));
  console.log('--- ROLES ---');
  roles.forEach(r => console.log(`Role ${r.nama_jabatan} (ID: ${r.id}, Level: ${r.level})`));
}
main().finally(() => prisma.$disconnect());
