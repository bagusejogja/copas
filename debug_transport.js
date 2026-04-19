const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("--- DETAIL DATA TRANSPORT ---");
  const data = await prisma.expenseReference.findMany({
    where: { 
       OR: [
         { id: 2 },
         { nama: { contains: 'Transportasi' } }
       ]
    }
  });
  console.log(JSON.stringify(data, null, 2));
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
