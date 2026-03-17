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

    // 2. Tentukan filter berdasarkan Role & Unit
    const { searchParams } = new URL(req.url);
    const filterUnit = searchParams.get('unit_id');
    const filterStatus = searchParams.get('status');

    const userStepIndex = flows.findIndex(f => f.role_id === payload.role.id);
    const isBendahara = payload.role.id === 5 || payload.role.level === 99;
    const isPusat = payload.unit.id === 1 || payload.role.level === 99;

    let whereClause: any = {};

    if (!isPusat) {
      whereClause.unit_id = payload.unit.id;
    } else if (filterUnit) {
      whereClause.unit_id = Number(filterUnit);
    }

    const possibleStatuses = [];
    
    // 1. Berdasarkan Flow (Urutan)
    if (userStepIndex !== -1) {
      if (userStepIndex === 0) {
        possibleStatuses.push('PENDING');
      } else {
        // Menunggu persetujuan setelah langkah sebelumnya sukses
        possibleStatuses.push(`APPROVED_STEP_${flows[userStepIndex-1].id}`);
      }
    }

    // 2. Berdasarkan Bendahara (Siap Bayar)
    if (isBendahara) {
      possibleStatuses.push('APPROVED_FINAL');
    }

    // 3. Gabungkan dalam whereClause
    if (filterStatus) {
      whereClause.status_terakhir = filterStatus;
    } else {
      if (possibleStatuses.length > 0) {
        whereClause.status_terakhir = { in: possibleStatuses };
      } else {
        // Jika tidak punya peran approval sama sekali, berikan hasil kosong
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
