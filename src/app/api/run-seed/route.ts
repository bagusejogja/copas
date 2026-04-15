import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    for (const m of menus) {
      await prisma.menu.upsert({
        where: { path: m.path },
        update: { nama_menu: m.nama_menu },
        create: { nama_menu: m.nama_menu, path: m.path }
      });
    }

    const adminRole = await prisma.role.findFirst({ where: { level: 99 } });
    if (adminRole) {
      const allMenus = await prisma.menu.findMany();
      for (const m of allMenus) {
        await prisma.permission.upsert({
          where: { 
            role_id_menu_id: { role_id: adminRole.id, menu_id: m.id }
          },
          update: { can_read: true, can_create: true, can_update: true, can_delete: true },
          create: { 
            role_id: adminRole.id, menu_id: m.id,
            can_read: true, can_create: true, can_update: true, can_delete: true 
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database berhasil diseed!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
