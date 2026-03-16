import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    // Bendahara or Admin can see all submitted SPJs
    const isTreasurer = payload.role.id === 5 || payload.role.level === 99;
    if (!isTreasurer) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const lpjs = await prisma.pertanggungjawaban.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        proposal: {
          include: { 
            unit: true, 
            pemohon: true,
            activity_type: true,
            details: true
          }
        },
        details: { include: { account: true } }
      },
      orderBy: { tanggal_laporan: 'desc' }
    });

    return NextResponse.json(lpjs);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    const { lpj_id, action, catatan } = await req.json();

    if (payload.role.id !== 5 && payload.role.level !== 99) {
      return NextResponse.json({ message: 'Only treasurer can approve SPJ' }, { status: 403 });
    }

    const lpj = await prisma.pertanggungjawaban.findUnique({ where: { id: Number(lpj_id) } });
    if (!lpj) return NextResponse.json({ message: 'LPJ not found' }, { status: 404 });

    const newStatus = action === 'APPROVE' ? 'APPROVED_FINAL' : 'REJECTED';

    await prisma.pertanggungjawaban.update({
      where: { id: lpj.id },
      data: { status: newStatus }
    });

    return NextResponse.json({ message: `SPJ berhasil ${action === 'APPROVE' ? 'disetujui' : 'ditolak'}` });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
