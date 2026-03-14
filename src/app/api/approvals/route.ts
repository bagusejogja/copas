import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    let whereClause: any = { unit_id: payload.unit.id };

    // Logika Berjenjang
    if (payload.role.level === 2) {
       // Atasan Penginput menyetujui staf
       whereClause.status_terakhir = 'PENDING';
    } else if (payload.role.level === 3) {
       // Review Pusat / Pimpinan menyetujui dari atasan
       whereClause.status_terakhir = 'APPROVED_LV1';
       if (payload.unit.id === 1) delete whereClause.unit_id; // Pusat bisa lihat semua unit
    } else if (payload.role.level === 4) {
       // Approval Akhir Pusat
       whereClause.status_terakhir = 'APPROVED_LV2';
       if (payload.unit.id === 1) delete whereClause.unit_id; 
    } else if (payload.role.level === 99) { // Administrator
       whereClause = {};
    } else {
       // Level 1 (Staf) atau 5 (Bendahara) tidak ada di antrean approval aktif 
       // (Bendahara mungkin hanya view yang sudah final)
       if (payload.role.level === 5) {
          whereClause.status_terakhir = 'APPROVED_FINAL';
          if (payload.unit.id === 1) delete whereClause.unit_id;
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

    // === GUARD: Blokir REJECT jika sudah melewati level approver atau sudah final ===
    if (action === 'REJECT') {
      const finalStatuses = ['APPROVED_FINAL'];
      if (finalStatuses.includes(proposal.status_terakhir)) {
        return NextResponse.json({ message: 'Usulan sudah cair/final, tidak dapat ditolak.' }, { status: 403 });
      }
      // Peta level minimum yang diperlukan untuk menolak masing-masing status
      const rejectLevelRequired: Record<string, number> = {
        PENDING: 2,          // Hanya atasan unit (level 2+) yang bisa tolak PENDING
        APPROVED_LV1: 3,     // Hanya level 3+ yang bisa tolak APPROVED_LV1
        APPROVED_LV2: 4,     // Hanya level 4+ yang bisa tolak APPROVED_LV2
      };
      const requiredLevel = rejectLevelRequired[proposal.status_terakhir] ?? 99;
      if (payload.role.level < requiredLevel) {
        return NextResponse.json({
          message: `Anda tidak berwenang menolak usulan yang sudah disetujui level di atas Anda (status: ${proposal.status_terakhir}).`
        }, { status: 403 });
      }
    }

    let newStatus = proposal.status_terakhir;
    if (action === 'REJECT') {
       newStatus = 'REJECTED';
    } else if (action === 'APPROVE') {
       if (proposal.status_terakhir === 'PENDING') newStatus = 'APPROVED_LV1';
       else if (proposal.status_terakhir === 'APPROVED_LV1') newStatus = 'APPROVED_LV2';
       else if (proposal.status_terakhir === 'APPROVED_LV2') newStatus = 'APPROVED_FINAL';
    }

    await prisma.$transaction(async (tx) => {
       // 1. Update proposal status
       await tx.proposal.update({
          where: { id: proposal.id },
          data: { status_terakhir: newStatus }
       });

       // 2. If APPROVE with adjusted nominals, update each detail
       if (action === 'APPROVE' && Array.isArray(adjustedDetails) && adjustedDetails.length > 0) {
          for (const d of adjustedDetails) {
             await tx.proposalDetail.update({
                where: { id: d.id },
                data: { nominal: d.nominal }
             });
          }
       }

       // 3. Insert approval history
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
    return NextResponse.json({ message: 'Error processing approval' }, { status: 500 });
  }
}
