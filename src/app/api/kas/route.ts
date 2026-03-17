import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterUnit = searchParams.get('unit_id');

    // Filter by unit if not admin/high-level/bendahara
    const isAdmin = payload.role.level === 99 || payload.role.id === 5;
    
    let whereClause: any = {};
    if (filterUnit) {
      if (isAdmin || payload.unit.id === 1) {
        whereClause.unit_id = Number(filterUnit);
      } else {
        whereClause.unit_id = payload.unit?.id;
      }
    } else {
      // Default: Only show current user's unit unless Admin/PDM explicitly asks for others
      whereClause.unit_id = payload.unit?.id;
    }

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
