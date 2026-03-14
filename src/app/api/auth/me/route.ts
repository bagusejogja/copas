import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const payload: any = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Fetch full permissions for the role
  const permissions = await prisma.permission.findMany({
    where: { role_id: payload.role.id },
    include: { menu: true }
  });

  return NextResponse.json({
    ...payload,
    permissions
  });
}
