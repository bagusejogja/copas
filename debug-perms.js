const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const menus = await prisma.menu.findMany();
    console.log('Total Menus:', menus.length);
    console.log('Menus:', JSON.stringify(menus, null, 2));

    const roles = await prisma.role.findMany();
    console.log('Roles:', JSON.stringify(roles, null, 2));

    const permissions = await prisma.permission.findMany({
        include: { menu: true, role: true }
    });
    console.log('Total Permissions:', permissions.length);
    console.log('Permissions Summary:', permissions.map(p => `${p.role.nama_jabatan} -> ${p.menu.path} (Read: ${p.can_read})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
