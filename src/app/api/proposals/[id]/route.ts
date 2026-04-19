import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("Fetching single proposal:", id);
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: Number(id) },
      include: {
        details: {
          include: {
            expense_reference: true,
            account: true
          }
        },
        unit: true,
        activity_type: true,
        approvals: {
          include: { approver: { include: { role: true } } },
          orderBy: { tanggal: 'asc' }
        }
      }
    });

    console.log("Proposal data for edit:", proposal ? "Found" : "Not Found");
    if (!proposal) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const p_id = Number(id);
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    const body = await req.json();
    const { 
      judul, activity_type_id, details,
      latar_belakang, tujuan, bentuk_kegiatan, jumlah_peserta, 
      kerjasama, peralatan, tanggal_mulai, tanggal_selesai, tempat, 
      susunan_panitia, proker_id
    } = body;

    // Update proposal and rebuild details
    const proposal = await prisma.$transaction(async (tx) => {
      // 1. Delete old details
      await tx.proposalDetail.deleteMany({ where: { proposal_id: p_id } });

      // 2. Determine initial status (Check if we should skip the first step in flow)
      let targetStatus = 'PENDING';
      const flows = await tx.approvalFlow.findMany({
        where: { is_active: true },
        orderBy: { urutan: 'asc' }
      });
      
      if (flows.length > 0 && flows[0].role_id === payload.role.id) {
         // Auto-advance since the editor is the first approver
         targetStatus = flows.length > 1 ? `APPROVED_STEP_${flows[0].id}` : 'APPROVED_FINAL';
      }

      // 3. Update proposal
      return await tx.proposal.update({
        where: { id: p_id },
        data: {
          judul,
          activity_type_id: Number(activity_type_id),
          proker_id: proker_id ? Number(proker_id) : null,
          latar_belakang,
          tujuan,
          bentuk_kegiatan,
          jumlah_peserta: jumlah_peserta ? Number(jumlah_peserta) : null,
          kerjasama,
          peralatan,
          tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null,
          tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null,
          tempat,
          susunan_panitia,
          status_terakhir: targetStatus,
          details: {
            create: details.map((d: any) => ({
               expense_reference_id: Number(d.expense_reference_id || d.expense_reference?.id),
               account_id: Number(d.account_id || d.account?.id),
               deskripsi: d.deskripsi,
               nominal: Number(d.nominal)
            }))
          }
        }
      });
    });

    return NextResponse.json({ message: 'Usulan berhasil diperbarui!', proposal });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating' }, { status: 500 });
  }
}
