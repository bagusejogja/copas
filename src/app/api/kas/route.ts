import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getVisibleUnitIds } from '@/lib/unit-hierarchy';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterUnit = searchParams.get('unit_id');

    // Filter by unit - hierarchical visibility
    const isAdmin = payload.role.level === 99 || payload.role.id === 5;
    
    let whereClause: any = {};
    if (filterUnit) {
      if (isAdmin || payload.unit.id === 1) {
        whereClause.unit_id = Number(filterUnit);
      } else {
        whereClause.unit_id = payload.unit?.id;
      }
    } else {
      // Default: show current user's unit + all descendants
      const visibleIds = await getVisibleUnitIds(payload.unit?.id);
      whereClause.unit_id = { in: visibleIds };
    }
    // Date range filter
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from || to) {
      whereClause.tanggal = {};
      if (from) whereClause.tanggal.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.tanggal.lte = toDate;
      }
    }

    const records = await prisma.kas.findMany({
      where: whereClause,
      orderBy: { tanggal: 'asc' },
      include: { proposal: { select: { judul: true } } }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching Kas' }, { status: 500 });
  }
}
