import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    
    // get proposals that are FINALIZED or PAID
    const whereClause = payload.role.level === 99 ? {} : { unit_id: payload.unit.id };

    const proposals = await prisma.proposal.findMany({
      where: {
         ...whereClause,
         status_terakhir: 'PAID'
      },
      include: {
         pertanggungjawabans: {
            include: { details: { include: { account: true } } }
         },
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
    const body = await req.json();
    const { 
      proposal_id, ringkasan, total_realisasi, status, 
      nama_pembuat, nama_bendahara, nama_pimpinan, details 
    } = body;

    if (!proposal_id) return NextResponse.json({ message: 'Proposal ID is required' }, { status: 400 });

    // Validation: Realization cannot exceed Approved Proposal Amount
    const proposal = await prisma.proposal.findUnique({
      where: { id: Number(proposal_id) },
      include: { details: true }
    });

    if (!proposal) return NextResponse.json({ message: 'Proposal tidak ditemukan' }, { status: 404 });

    const totalApproved = proposal.details.reduce((sum, d) => sum + Number(d.nominal), 0);
    if (Number(total_realisasi) > totalApproved) {
      return NextResponse.json({ 
        message: `Gagal Simpan! Total realisasi (Rp ${Number(total_realisasi).toLocaleString('id-ID')}) melebihi jumlah yang disetujui (Rp ${totalApproved.toLocaleString('id-ID')}).` 
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing if any (support save as draft overwrite)
      await tx.pertanggungjawaban.deleteMany({ where: { proposal_id: Number(proposal_id) } });

      // 2. Create new
      return await tx.pertanggungjawaban.create({
        data: {
          proposal_id: Number(proposal_id),
          ringkasan,
          total_realisasi: Number(total_realisasi),
          status: status || 'SUBMITTED',
          nama_pembuat,
          nama_bendahara,
          nama_pimpinan,
          details: {
            create: (details || []).map((d: any) => ({
              account_id: Number(d.account_id),
              keterangan: d.keterangan || d.deskripsi,
              nominal: Number(d.nominal)
            }))
          }
        },
        include: { details: true }
      });
    });

    return NextResponse.json({ message: 'Laporan berhasil disimpan!', lpj: result }, { status: 201 });
  } catch (error: any) {
    console.error("SPJ POST ERROR:", error);
    return NextResponse.json({ message: error.message || 'Error creating LPJ' }, { status: 500 });
  }
}
