import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    
    const { searchParams } = new URL(req.url);
    const filterUnit = searchParams.get('unit_id');
    const filterStatus = searchParams.get('status');

    // PDM level (Unit ID 1) or Admin (Level 99) can see all
    const isPDM = payload.unit.id === 1 || payload.role.level === 99;
    
    let baseWhere: any = isPDM ? {} : { unit_id: payload.unit.id };
    if (filterUnit) baseWhere.unit_id = Number(filterUnit);

    const proposals = await prisma.proposal.findMany({
      where: {
         ...baseWhere,
         status_terakhir: 'PAID'
      },
      include: {
         pertanggungjawabans: {
            include: { details: { include: { account: true } } },
            orderBy: { id: 'desc' }
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
      lpj_id, proposal_id, ringkasan, total_realisasi, status, 
      nama_pembuat, nama_bendahara, nama_pimpinan, details 
    } = body;

    const pid = Number(proposal_id);
    if (!pid) return NextResponse.json({ message: 'Proposal ID is required' }, { status: 400 });

    const proposal = await prisma.proposal.findUnique({
      where: { id: pid },
      include: { 
        details: true,
        pertanggungjawabans: {
          where: { 
             id: { not: lpj_id ? Number(lpj_id) : 0 },
             status: { not: 'REJECTED' } 
          }
        }
      }
    });

    if (!proposal) return NextResponse.json({ message: 'Proposal tidak ditemukan' }, { status: 404 });

    const totalApproved = proposal.details.reduce((sum, d) => sum + Number(d.nominal), 0);
    const existingRealization = proposal.pertanggungjawabans.reduce((sum, pj) => sum + Number(pj.total_realisasi), 0);
    const newRealization = Number(total_realisasi);

    if (existingRealization + newRealization > totalApproved) {
      const sisa = totalApproved - existingRealization;
      return NextResponse.json({ 
        message: `Gagal Simpan! Total realisasi kumulatif (Rp ${(existingRealization + newRealization).toLocaleString('id-ID')}) melebihi anggaran yang disetujui (Rp ${totalApproved.toLocaleString('id-ID')}). Sisa anggaran tersedia: Rp ${sisa.toLocaleString('id-ID')}` 
      }, { status: 400 });
    }

    const sisaDana = totalApproved - (existingRealization + newRealization);
    const finalStatus = status || 'SUBMITTED';

    const result = await prisma.$transaction(async (tx) => {
      // 1. If lpj_id exists, delete its old data (simple update strategy)
      if (lpj_id) {
         await tx.pertanggungjawabanDetail.deleteMany({ where: { pj_id: Number(lpj_id) } });
         await tx.pertanggungjawaban.delete({ where: { id: Number(lpj_id) } });
      }

      // 2. Create new record (for either fresh or updated draft)
      const lpj = await (tx as any).pertanggungjawaban.create({
        data: {
          proposal_id: pid,
          ringkasan,
          total_diterima: totalApproved,
          total_realisasi: newRealization,
          sisa_dana: sisaDana,
          opsi_sisa: body.opsi_sisa || 'KEMBALI',
          status: finalStatus,
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

      return lpj;
    });

    return NextResponse.json({ message: 'Laporan berhasil disimpan!', lpj: result }, { status: 201 });
  } catch (error: any) {
    console.error("SPJ POST ERROR:", error);
    return NextResponse.json({ message: error.message || 'Error creating LPJ' }, { status: 500 });
  }
}
