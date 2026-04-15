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
        unit: {
          include: { 
            paguRecords: true,
            users: {
              include: { role: true }
            }
          }
        },
        dibuat_oleh: { include: { role: true } },
        proposals: {
          select: {
            id: true,
            status_terakhir: true,
            details: { select: { nominal: true } },
            pertanggungjawabans: true
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
    const tahun = Number(body.periode_tahun);
    const unitId = payload.unit.id;

    // 1. Validation: Timeframe (skip for Admin level 99)
    if (payload.role.level < 99) {
      const settings = await prisma.globalSetting.findMany();
      const sMap = settings.reduce((acc: any, s) => { acc[s.key] = s.value; return acc; }, {});
      const now = new Date();
      if (sMap.proker_start_date && new Date(sMap.proker_start_date) > now) {
         return NextResponse.json({ message: 'Periode pengisian belum dibuka' }, { status: 403 });
      }
      if (sMap.proker_end_date && new Date(sMap.proker_end_date) < now) {
         return NextResponse.json({ message: 'Periode pengisian sudah ditutup' }, { status: 403 });
      }
    }

    // 2. Validation: Pagu
    const pagu = await prisma.unitPagu.findUnique({
      where: { unit_id_tahun: { unit_id: unitId, tahun } }
    });
    if (!pagu) {
      return NextResponse.json({ message: `Pagu anggaran unit untuk tahun ${tahun} belum ditetapkan oleh pusat.` }, { status: 400 });
    }

    const existingProkers = await prisma.programKerja.findMany({
      where: { unit_id: unitId, periode_tahun: tahun, is_active: true }
    });
    const totalExisting = existingProkers.reduce((sum, p) => sum + Number(p.anggaran_setahun), 0);
    const newTotal = totalExisting + Number(body.anggaran_setahun);

    if (newTotal > Number(pagu.nominal)) {
      return NextResponse.json({ 
        message: `Batas Pagu Terlampaui! Sisa pagu Bapak: Rp ${(Number(pagu.nominal) - totalExisting).toLocaleString('id-ID')}. Total yang diajukan: Rp ${Number(body.anggaran_setahun).toLocaleString('id-ID')}` 
      }, { status: 400 });
    }

    // Proker creation logic...
    const proker = await prisma.programKerja.create({
      data: {
        unit_id: unitId,
        periode_tahun: tahun,
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

    // Ensure ActivityType exists
    const exists = await prisma.activityType.findFirst({ where: { nama: body.nama_kegiatan, unit_id: unitId } });
    if (!exists) {
      await prisma.activityType.create({ data: { nama: body.nama_kegiatan, unit_id: unitId } });
    }

    return NextResponse.json(proker, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menyimpan proker' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyToken(token);

    const body = await req.json();
    const { id, ...data } = body;
    const unitId = payload.unit.id;
    const tahun = Number(data.periode_tahun);

    // Re-validate Pagu on Update
    const pagu = await prisma.unitPagu.findUnique({
      where: { unit_id_tahun: { unit_id: unitId, tahun } }
    });
    if (pagu) {
      const otherProkers = await prisma.programKerja.findMany({
        where: { unit_id: unitId, periode_tahun: tahun, is_active: true, id: { not: Number(id) } }
      });
      const totalOthers = otherProkers.reduce((sum, p) => sum + Number(p.anggaran_setahun), 0);
      if (totalOthers + Number(data.anggaran_setahun) > Number(pagu.nominal)) {
        return NextResponse.json({ message: 'Update gagal! Total anggaran melebihi Pagu.' }, { status: 400 });
      }
    }

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
