const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const flows = await prisma.approvalFlow.findMany({
    include: { role: true }
  });
  console.log('APPROVAL_FLOWS:', JSON.stringify(flows, null, 2));
}

main().finally(() => prisma.$disconnect());
