const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("--- EXPENSE REFERENCES ---");
  const expenses = await prisma.expenseReference.findMany({
    where: { nama: { contains: 'Transportasi' } }
  });
  console.log(JSON.stringify(expenses, null, 2));

  console.log("--- VISIBILITY RECORDS ---");
  const vis = await prisma.masterVisibility.findMany({
    where: { reference_type: 'expense' }
  });
  console.log(JSON.stringify(vis, null, 2));
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
