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

    const lpj = await (prisma as any).pertanggungjawaban.findUnique({ 
      where: { id: Number(lpj_id) },
      include: { proposal: true }
    });
    if (!lpj) return NextResponse.json({ message: 'LPJ not found' }, { status: 404 });

    const newStatus = action === 'APPROVE' ? 'APPROVED_FINAL' : 'REJECTED';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update SPJ
      const updatedLpj = await (tx as any).pertanggungjawaban.update({
        where: { id: lpj.id },
        data: { status: newStatus }
      });

      if (action === 'APPROVE') {
        // 2. Selalu Catat KELUAR di Kas Unit (Realisasi)
        await tx.kas.create({
          data: {
            tanggal: new Date(),
            proposal_id: lpj.proposal_id,
            tipe: 'KELUAR',
            kategori: 'Realisasi Kegiatan (SPJ)',
            deskripsi: `Realisasi kegiatan: ${lpj.proposal.judul}`,
            nominal: lpj.total_realisasi,
            unit_id: lpj.proposal.unit_id
          }
        });

        // 3. Jika OPSI KEMBALI, urus Kas PDM (Masuk) & Unit (Keluar) untu Sisa
        if (lpj.opsi_sisa === 'KEMBALI' && Number(lpj.sisa_dana) > 0) {
          // Keluar dari Unit (Sisa Dana Balik)
          await tx.kas.create({
            data: {
              tanggal: new Date(),
              proposal_id: lpj.proposal_id,
              tipe: 'KELUAR',
              kategori: 'Pengembalian Sisa Dana',
              deskripsi: `Pengembalian sisa dana usulan: ${lpj.proposal.judul}`,
              nominal: lpj.sisa_dana,
              unit_id: lpj.proposal.unit_id
            }
          });

          // Masuk ke PDM
          await tx.kas.create({
            data: {
              tanggal: new Date(),
              proposal_id: lpj.proposal_id,
              tipe: 'MASUK',
              kategori: 'Pengembalian Sisa Dana dari Unit',
              deskripsi: `Terima sisa dana usulan: ${lpj.proposal.judul} (Unit ID: ${lpj.proposal.unit_id})`,
              nominal: lpj.sisa_dana,
              unit_id: 1 // PDM Pusat
            }
          });
        }
      }

      return updatedLpj;
    });

    return NextResponse.json({ message: `SPJ berhasil ${action === 'APPROVE' ? 'disetujui' : 'ditolak'}` });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
