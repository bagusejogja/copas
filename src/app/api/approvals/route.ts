import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    
    // 1. Ambil Alur Approval Aktif
    const flows = await prisma.approvalFlow.findMany({
      where: { is_active: true },
      orderBy: { urutan: 'asc' }
    });

    // 2. Tentukan posisi user di alur
    const userStepIndex = flows.findIndex(f => f.role_id === payload.role.id);
    const isBendahara = payload.role.id === 5 || payload.role.level === 99;

    let whereClause: any = { unit_id: payload.unit.id };
    if (payload.unit.id === 1 || payload.role.level === 99) delete whereClause.unit_id;

    if (payload.role.level === 99) {
       // Admin see all non-paid and non-rejected
       whereClause.status_terakhir = { in: ['PENDING', 'APPROVED_LV1', 'APPROVED_LV2', 'APPROVED_FINAL'] };
       // Also include dynamic steps
       const dynamicSteps = flows.map(f => `APPROVED_STEP_${f.id}`);
       if (Array.isArray(whereClause.status_terakhir.in)) {
         whereClause.status_terakhir.in.push(...dynamicSteps);
       }
    } else {
       const possibleStatuses = [];
       
       // 1. Ambil status berdasarkan alur approval
       if (userStepIndex !== -1) {
          if (userStepIndex === 0) {
             possibleStatuses.push('PENDING');
          } else {
             possibleStatuses.push(`APPROVED_STEP_${flows[userStepIndex-1].id}`);
          }
          
          // Backwards Compatibility for old level-based statuses
          if (payload.role.level === 3) possibleStatuses.push('APPROVED_LV1');
          if (payload.role.level === 4) possibleStatuses.push('APPROVED_LV2');
       }
       
       // 2. Ambil status jika dia bendahara (untuk proses bayar)
       if (isBendahara) {
          possibleStatuses.push('APPROVED_FINAL');
       }

       if (possibleStatuses.length > 0) {
          whereClause.status_terakhir = { in: possibleStatuses };
       } else {
          return NextResponse.json([]);
       }
    }

    const proposals = await prisma.proposal.findMany({
      where: whereClause,
      include: {
        unit: true,
        pemohon: true,
        activity_type: true,
        details: true,
        approvals: {
          include: { approver: { include: { role: true } } },
          orderBy: { tanggal: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    return NextResponse.json(proposals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching approvals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    const { proposal_id, action, catatan, adjustedDetails } = await req.json();

    const proposal = await prisma.proposal.findUnique({ where: { id: Number(proposal_id) }});
    if (!proposal) return NextResponse.json({ message: 'Proposal tidak ditemukan' }, { status: 404 });

    // 1. Ambil Alur Approval Aktif
    const flows = await prisma.approvalFlow.findMany({
      where: { is_active: true },
      orderBy: { urutan: 'asc' }
    });

    const userStepIndex = flows.findIndex(f => f.role_id === payload.role.id);
    
    if (action === 'REJECT') {
       if (proposal.status_terakhir === 'APPROVED_FINAL' || proposal.status_terakhir === 'PAID') {
          return NextResponse.json({ message: 'Selesai/Dibayar, tidak bisa ditolak.' }, { status: 403 });
       }
    }

    let newStatus = proposal.status_terakhir;
    if (action === 'REJECT') {
       newStatus = 'REJECTED'; 
    } else if (action === 'APPROVE') {
       // Tentukan status selanjutnya
       if (userStepIndex !== -1 && userStepIndex < flows.length - 1) {
          // Masih ada langkah selanjutnya
          newStatus = `APPROVED_STEP_${flows[userStepIndex].id}`;
       } else {
          // Langkah terakhir di alur
          newStatus = 'APPROVED_FINAL';
       }
    }

    await prisma.$transaction(async (tx) => {
       await tx.proposal.update({
          where: { id: proposal.id },
          data: { status_terakhir: newStatus }
       });

       if (action === 'APPROVE' && Array.isArray(adjustedDetails) && adjustedDetails.length > 0) {
          for (const d of adjustedDetails) {
             await tx.proposalDetail.update({
                where: { id: d.id },
                data: { nominal: d.nominal }
             });
          }
       }

       await tx.approval.create({
          data: {
             proposal_id: proposal.id,
             approver_id: payload.id,
             status: action,
             catatan: catatan || '',
             level_approval: payload.role.level
          }
       });
    });

    return NextResponse.json({ message: 'Persetujuan berhasil diproses' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
