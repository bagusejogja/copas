import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let payload: any = null;
    if (token) payload = await verifyToken(token);

    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get('tahun');
    const unitId = searchParams.get('unit_id');

    const isPusat = !payload || payload.role.level >= 99 || payload.unit.id === 1;
    const whereClause: any = {};
    if (tahun) whereClause.periode_tahun = Number(tahun);
    if (!isPusat) whereClause.unit_id = payload.unit.id;
    else if (unitId) whereClause.unit_id = Number(unitId);

    const prokerList = await prisma.programKerja.findMany({
      where: whereClause,
      include: {
        unit: true,
        dibuat_oleh: { include: { role: true } },
        proposals: {
          select: {
            id: true,
            status_terakhir: true,
            details: { select: { nominal: true } }
          }
        }
      },
      orderBy: [{ periode_tahun: 'desc' }, { id: 'asc' }]
    });

    return NextResponse.json(prokerList);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    const body = await req.json();

    // Otomatis masukkan ke Master Data Referensi (ActivityType) jika belum ada
    await prisma.activityType.upsert({
      where: { id: -1 }, // Harusnya pake unique constraint (nama, unit_id), tapi schema belum ada unique di situ
      // Karena belum ada unique constraint, kita check manual
      create: {
        nama: body.nama_kegiatan,
        unit_id: payload.unit.id,
        is_active: true
      },
      update: {}
    });
    // Alternatif: find first then create
    const existingType = await prisma.activityType.findFirst({
      where: { nama: body.nama_kegiatan, unit_id: payload.unit.id }
    });
    let activityTypeId;
    if (!existingType) {
      const newType = await prisma.activityType.create({
        data: { nama: body.nama_kegiatan, unit_id: payload.unit.id, is_active: true }
      });
      activityTypeId = newType.id;
    } else {
      activityTypeId = existingType.id;
    }

    const proker = await prisma.programKerja.create({
      data: {
        unit_id: payload.unit.id,
        periode_tahun: Number(body.periode_tahun),
        nama_kegiatan: body.nama_kegiatan,
        sifat_kegiatan: body.sifat_kegiatan,
        uraian_kegiatan: body.uraian_kegiatan || null,
        lembaga_mitra: body.lembaga_mitra || null,
        sasaran: body.sasaran || null,
        tujuan: body.tujuan || null,
        strategi: body.strategi || null,
        indikator: body.indikator || null,
        anggaran_setahun: Number(body.anggaran_setahun),
        tanggal_mulai: body.tanggal_mulai ? new Date(body.tanggal_mulai) : null,
        tanggal_selesai: body.tanggal_selesai ? new Date(body.tanggal_selesai) : null,
        is_active: true,
        dibuat_oleh_id: payload.id,
      }
    });
    return NextResponse.json(proker, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menyimpan proker' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const proker = await prisma.programKerja.update({
      where: { id: Number(id) },
      data: {
        nama_kegiatan: data.nama_kegiatan,
        sifat_kegiatan: data.sifat_kegiatan,
        uraian_kegiatan: data.uraian_kegiatan || null,
        lembaga_mitra: data.lembaga_mitra || null,
        sasaran: data.sasaran || null,
        tujuan: data.tujuan || null,
        strategi: data.strategi || null,
        indikator: data.indikator || null,
        anggaran_setahun: Number(data.anggaran_setahun),
        tanggal_mulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : null,
        tanggal_selesai: data.tanggal_selesai ? new Date(data.tanggal_selesai) : null,
        is_active: data.is_active !== undefined ? data.is_active : true,
      }
    });
    return NextResponse.json(proker);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.programKerja.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: 'Dihapus' });
}
