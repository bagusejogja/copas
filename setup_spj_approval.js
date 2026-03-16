const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Tambah menu Persetujuan SPJ
  const menuPath = '/dashboard/pertanggungjawaban/approvals';
  let menu = await prisma.menu.findUnique({ where: { path: menuPath } });
  if (!menu) {
    menu = await prisma.menu.create({
      data: {
        nama_menu: 'Persetujuan SPJ',
        path: menuPath
      }
    });
    console.log('Menu created:', menu.nama_menu);
  }

  // 2. Beri izin ke Bendahara (Role ID 5) dan Admin (Role ID 99)
  const roles = [5, 99];
  for (const rId of roles) {
    await prisma.permission.upsert({
      where: { role_id_menu_id: { role_id: rId, menu_id: menu.id } },
      update: { can_read: true, can_create: true, can_update: true, can_delete: true },
      create: {
        role_id: rId,
        menu_id: menu.id,
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: true
      }
    });
    console.log(`Permission granted to Role ID ${rId}`);
  }
}

main().finally(() => prisma.$disconnect());
