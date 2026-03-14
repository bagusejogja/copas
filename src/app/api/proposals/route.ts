import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    
    const proposals = await prisma.proposal.findMany({
      where: payload.role.level === 99 ? {} : { unit_id: payload.unit.id },
      include: {
        unit: true,
        pemohon: true,
        activity_type: true,
        details: true
      },
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching proposals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      unit_id, pemohon_id, judul, activity_type_id, details,
      latar_belakang, tujuan, bentuk_kegiatan, jumlah_peserta, 
      kerjasama, peralatan, tanggal_mulai, tanggal_selesai, tempat, 
      susunan_panitia, proker_id
    } = body;

    if (!judul || !activity_type_id || !details || details.length === 0) {
      return NextResponse.json({ message: 'Isian form belum lengkap!' }, { status: 400 });
    }

    const totalNominal = details.reduce((sum: number, d: any) => sum + (Number(d.nominal) || 0), 0);

    // Validasi Anggaran Proker jika ada link ke Proker
    if (proker_id) {
      const proker = await prisma.programKerja.findUnique({
        where: { id: Number(proker_id) },
        include: { proposals: { include: { details: true } } }
      });

      if (!proker) {
          return NextResponse.json({ message: 'Program Kerja tidak ditemukan' }, { status: 404 });
      }

      const alreadyUsed = proker.proposals.reduce((sum: number, p: any) => sum + p.details.reduce((s: number, det: any) => s + Number(det.nominal), 0), 0);
      const remaining = Number(proker.anggaran_setahun) - alreadyUsed;

      if (totalNominal > remaining) {
          return NextResponse.json({ message: `Anggaran tidak mencukupi. Sisa anggaran Proker: Rp ${remaining.toLocaleString('id-ID')}` }, { status: 400 });
      }
    }

    const proposal = await prisma.proposal.create({
      data: {
        unit_id: Number(unit_id),
        pemohon_id: Number(pemohon_id),
        judul,
        activity_type_id: Number(activity_type_id),
        status_terakhir: 'PENDING',
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
        details: {
          create: details.map((d: any) => ({
             expense_reference_id: Number(d.expense_reference_id),
             account_id: Number(d.account_id),
             deskripsi: d.deskripsi,
             nominal: Number(d.nominal)
          }))
        }
      }
    });

    return NextResponse.json({ message: 'Usulan berhasil diajukan!', proposal }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating proposal' }, { status: 500 });
  }
}
