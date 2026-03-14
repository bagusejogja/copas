import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    
    // get proposals that are FINALIZED so we can submit LPJ
    const whereClause = payload.role.level === 99 ? {} : { unit_id: payload.unit.id };

    const proposals = await prisma.proposal.findMany({
      where: {
         ...whereClause,
         status_terakhir: 'APPROVED_FINAL' // Only final can be submitted for LPJ
      },
      include: {
         pertanggungjawabans: true,
         activity_type: true,
         unit: true,
         details: true
      },
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching to pertanggungjawaban' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { proposal_id, ringkasan, total_realisasi } = await req.json();

    const lpj = await prisma.pertanggungjawaban.create({
       data: {
          proposal_id: Number(proposal_id),
          ringkasan,
          total_realisasi: Number(total_realisasi)
       }
    });

    return NextResponse.json({ message: 'Laporan berhasil disimpan!', lpj }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating LPJ' }, { status: 500 });
  }
}
