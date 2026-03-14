const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const menus = [
      { nama_menu: 'Dashboard', path: '/dashboard' },
      { nama_menu: 'Program Kerja Tahunan', path: '/dashboard/proker' },
      { nama_menu: 'Usulan Anggaran', path: '/dashboard/proposals' },
      { nama_menu: 'Persetujuan (Approval)', path: '/dashboard/approvals' },
      { nama_menu: 'Laporan Pendanaan (LPJ)', path: '/dashboard/pertanggungjawaban' },
      { nama_menu: 'Master Data Referensi', path: '/dashboard/master' },
      { nama_menu: 'Alur Persetujuan', path: '/dashboard/approval-flow' },
      { nama_menu: 'Manajemen Unit', path: '/dashboard/units' },
      { nama_menu: 'Manajemen Pengguna', path: '/dashboard/users' },
      { nama_menu: 'Hak Akses', path: '/dashboard/menus' },
    ];

    console.log('Syncing menus...');
    for (const m of menus) {
      await prisma.menu.upsert({
        where: { path: m.path },
        update: { nama_menu: m.nama_menu },
        create: { nama_menu: m.nama_menu, path: m.path }
      });
    }

    console.log('Giving Administrator (Role ID 99/Administrator) all permissions...');
    const adminRole = await prisma.role.findFirst({ where: { level: 99 } });
    if (adminRole) {
      const allMenus = await prisma.menu.findMany();
      for (const m of allMenus) {
        await prisma.permission.upsert({
          where: { 
            role_id_menu_id: {
               role_id: adminRole.id,
               menu_id: m.id
            }
          },
          update: { can_read: true, can_create: true, can_update: true, can_delete: true },
          create: { 
            role_id: adminRole.id, 
            menu_id: m.id,
            can_read: true, 
            can_create: true, 
            can_update: true, 
            can_delete: true 
          }
        });
      }
    }

    // Also give permissions to 'Penginput Usulan Unit' for basic stuff
    const unitRole = await prisma.role.findFirst({ where: { level: 1 } });
    if (unitRole) {
       const basicMenus = ['/dashboard', '/dashboard/proker', '/dashboard/proposals', '/dashboard/pertanggungjawaban'];
       for (const path of basicMenus) {
          const menu = await prisma.menu.findUnique({ where: { path } });
          if (menu) {
             await prisma.permission.upsert({
                where: { role_id_menu_id: { role_id: unitRole.id, menu_id: menu.id } },
                update: { can_read: true, can_create: true },
                create: { role_id: unitRole.id, menu_id: menu.id, can_read: true, can_create: true }
             });
          }
       }
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
