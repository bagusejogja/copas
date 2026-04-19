
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("--- MasterVisibility Table Check ---");
    const data = await prisma.masterVisibility.findMany({
      take: 10,
      orderBy: { id: 'desc' }
    });
    console.log(JSON.stringify(data, null, 2));
    
    const count = await prisma.masterVisibility.count();
    console.log("Total records:", count);
  } catch (e) {
    console.error("Error checking DB:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
