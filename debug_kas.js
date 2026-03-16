const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const units = await prisma.unit.findMany();
  console.log('UNITS:', JSON.stringify(units, null, 2));
  
  const kas = await prisma.kas.findMany({ include: { proposal: true } });
  console.log('KAS_RECORDS:', JSON.stringify(kas, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
