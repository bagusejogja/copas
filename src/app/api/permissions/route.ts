import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get('roleId');

  if (!roleId) return NextResponse.json({ message: 'roleId diperlukan' }, { status: 400 });

  const permissions = await prisma.permission.findMany({
    where: { role_id: Number(roleId) }
  });

  return NextResponse.json(permissions);
}

export async function POST(req: Request) {
  try {
    const { roleId, permissions } = await req.json();

    if (!roleId || !permissions) {
      return NextResponse.json({ message: 'Input tidak valid' }, { status: 400 });
    }

    // Karena checkbox matrix mengirim mapping penuh, kita hapus izin sebelumnya dan insert baru
    await prisma.$transaction(async (tx) => {
      // Delete old permissions for this role
      await tx.permission.deleteMany({
        where: { role_id: Number(roleId) }
      });

      // Filter only those that have at least one permission checked to optimize DB rows
      const toInsert = permissions.filter((p: any) => 
         p.can_read || p.can_create || p.can_update || p.can_delete
      ).map((p: any) => ({
         role_id: Number(roleId),
         menu_id: Number(p.menu_id),
         can_read: Boolean(p.can_read),
         can_create: Boolean(p.can_create),
         can_update: Boolean(p.can_update),
         can_delete: Boolean(p.can_delete)
      }));

      if (toInsert.length > 0) {
        await tx.permission.createMany({
          data: toInsert
        });
      }
    });

    return NextResponse.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Save permissions error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
