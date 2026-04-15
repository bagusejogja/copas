import { prisma } from '@/lib/prisma';
import PermissionManager from './PermissionManager';

export const dynamic = 'force-dynamic';

export default async function MenusPage() {
  // Ambil semua daftar Jabatan (Role) dan Menu
  const roles = await prisma.role.findMany({
    orderBy: { level: 'asc' }
  });

  // Jika tabel menu kosong, kita akan generate beberapa menu bawaan untuk uji coba
  let menus = await prisma.menu.findMany();
  if (menus.length === 0) {
    await prisma.menu.createMany({
      data: [
        { nama_menu: 'Dashboard', path: '/dashboard' },
        { nama_menu: 'Manajemen Menu', path: '/dashboard/menus' },
        { nama_menu: 'Manajemen User', path: '/dashboard/users' },
        { nama_menu: 'Data Unit', path: '/dashboard/units' },
        { nama_menu: 'Pengajuan Usulan', path: '/dashboard/proposals' },
        { nama_menu: 'Approval Atasan', path: '/dashboard/approval/level1' },
         { nama_menu: 'Approval Pusat', path: '/dashboard/approval/level2' }
      ]
    });
    menus = await prisma.menu.findMany();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Menu & Hak Akses</h1>
        <p className="mt-2 text-gray-600">Atur kewenangan setiap jabatan untuk dapat melihat, menambah, mengubah, atau menghapus data.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <PermissionManager initialRoles={roles} initialMenus={menus} />
      </div>
    </div>
  );
}
