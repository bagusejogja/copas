import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const payload: any = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Fetch fresh user data from DB
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      role: true,
      unit: { include: { paguRecords: true } }
    }
  });

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Fetch full permissions for the role
  const permissions = await prisma.permission.findMany({
    where: { role_id: user.role.id },
    include: { menu: true }
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: { id: user.role.id, nama: user.role.nama_jabatan, level: user.role.level },
    unit: user.unit,
    unit_id: Number(user?.unit_id || user?.unit?.id),
    permissions
  });
}
