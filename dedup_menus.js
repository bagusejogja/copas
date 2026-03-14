const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.menu.findMany();
  const seen = new Set();
  const duplicates = [];
  
  for (const menu of menus) {
    if (seen.has(menu.path)) {
      duplicates.push(menu.id);
    } else {
      seen.add(menu.path);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`Deleting duplicates: ${duplicates.join(', ')}`);
    await prisma.permission.deleteMany({
      where: {
        menu_id: { in: duplicates }
      }
    });
    await prisma.menu.deleteMany({
      where: {
        id: { in: duplicates }
      }
    });
  } else {
    console.log('No duplicates found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
