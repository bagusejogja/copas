import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Filter by unit if not admin/high-level/bendahara
    const isPusat = payload.role.level === 99 || (payload.unit && payload.unit.id === 1) || payload.role.id === 5;
    const whereClause = isPusat ? {} : { unit_id: payload.unit?.id };

    const records = await prisma.kas.findMany({
      where: whereClause,
      orderBy: { tanggal: 'desc' },
      include: { proposal: { select: { judul: true } } }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching Kas' }, { status: 500 });
  }
}
