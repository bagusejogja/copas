
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DAFTAR ROLE ---');
  const roles = await prisma.role.findMany();
  console.log(JSON.stringify(roles, null, 2));

  console.log('\n--- ALUR APPROVAL (FLOW) ---');
  const flows = await prisma.approvalFlow.findMany({
    where: { is_active: true },
    include: { role: true },
    orderBy: { urutan: 'asc' }
  });
  console.log(JSON.stringify(flows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
