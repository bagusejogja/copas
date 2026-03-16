const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.proposal.findMany();
  console.log('STATUSES:', p.map(x => ({ id: x.id, title: x.judul, status: x.status_terakhir })));
}

main().finally(() => prisma.$disconnect());
