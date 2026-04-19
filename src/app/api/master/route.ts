import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: semua referensi (expense, activity, role, account)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get('unitId');
  const onlyActive = searchParams.get('onlyActive') === 'true';

  let uid: number | null = null;
  if (unitId && unitId !== 'undefined' && unitId !== 'null' && unitId !== '') {
    uid = Number(unitId);
  }

  // Function to build query that includes:
  // 1. Data milik unit itu sendiri (unit_id matches)
  // 2. Data Global (unit_id is null) yang sudah DIAKTIFKAN untuk unit ini lewat MasterVisibility
  const getFilter = async (type: string) => {
    const base: any = {};
    if (onlyActive) {
      // Jika di form proposal (onlyActive=true), terapkan filter ketat
      if (!uid) return { is_active: true };
      
      const visibilityRecords = await prisma.masterVisibility.findMany({
        where: { unit_id: uid, reference_type: type, is_active: true },
        select: { reference_id: true }
      });
      const activeGlobalIds = visibilityRecords.map(a => a.reference_id);

      return {
        is_active: true,
        OR: [
          { unit_id: uid },
          { AND: [{ unit_id: null }, { id: { in: activeGlobalIds } }] }
        ]
      };
    }

    // Jika di halaman Master Data (onlyActive=false)
    if (!uid) return {};
    
    // Ambil daftar ID yang diizinkan untuk unit ini (berdasarkan tombol Atur Unit Superadmin)
    const allowedVisibility = await prisma.masterVisibility.findMany({
      where: { unit_id: uid, reference_type: type },
      select: { reference_id: true }
    });
    const allowedIds = allowedVisibility.map(v => v.reference_id);

    return {
      OR: [
        { unit_id: uid },
        // Item Pusat HANYA muncul jika: statusnya AKTIF di Pusat DAN Unit tersebut sudah diberi izin (dicentang di Atur Unit)
        { AND: [
            { unit_id: null }, 
            { is_active: true }, 
            { id: { in: allowedIds } }
          ] 
        }
      ]
    };
  };

  const [expenses, activities, accounts, roles] = await Promise.all([
    prisma.expenseReference.findMany({ where: await getFilter('expense'), orderBy: { id: 'asc' } }),
    prisma.activityType.findMany({ where: await getFilter('activity'), orderBy: { id: 'asc' } }),
    prisma.account.findMany({ where: await getFilter('account'), orderBy: { id: 'asc' } }),
    prisma.role.findMany({ where: onlyActive ? { is_active: true } : {}, orderBy: { level: 'asc' } }),
  ]);

  // Jika unitId disediakan, kita beri tanda apakah data ini "aktif di unit" tersebut
  const enrich = async (items: any[], type: string) => {
    if (!uid) return items;
    const visibilities = await prisma.masterVisibility.findMany({
      where: { unit_id: uid, reference_type: type, is_active: true }
    });
    const activeIds = visibilities.map(v => v.reference_id);
    console.log(`[DEBUG MASTER] Enriching ${items.length} items for type ${type}. UID: ${uid}`);
    return items.map(item => {
      // Debug record tertentu
      if (item.nama?.toLowerCase().includes('transport')) {
         console.log("[DEBUG ITEM]", { id: item.id, nama: item.nama, unit_id: item.unit_id, is_active: item.is_active });
      }

      const isGlobal = item.unit_id === null;
      if (isGlobal) {
        const activeInUnit = activeIds.includes(item.id);
        const isGlobalActive = Boolean(item.is_active);
        const finalStatus = isGlobalActive && activeInUnit;
        return { ...item, is_active_unit: finalStatus };
      }
      return { ...item, is_active_unit: item.is_active };
    });
  };

  return NextResponse.json({ 
    expenses: await enrich(expenses, 'expense'), 
    activities: await enrich(activities, 'activity'), 
    accounts: await enrich(accounts, 'account'), 
    roles 
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

// POST: create one record by type
export async function POST(req: NextRequest) {
  const { type, ...data } = await req.json();
  const unit_id = data.unit_id ? Number(data.unit_id) : null;

  try {
    if (type === 'expense') {
      const r = await prisma.expenseReference.create({ data: { nama: data.nama, unit_id, is_active: true } });
      return NextResponse.json(r, { status: 201 });
    }
    if (type === 'activity') {
      const r = await prisma.activityType.create({ data: { nama: data.nama, unit_id, is_active: true } });
      return NextResponse.json(r, { status: 201 });
    }
    if (type === 'account') {
      const r = await prisma.account.create({ data: { nomor: data.nomor, nama_akun: data.nama_akun, unit_id, is_active: true } });
      return NextResponse.json(r, { status: 201 });
    }
    if (type === 'role') {
      const r = await prisma.role.create({ data: { nama_jabatan: data.nama_jabatan, level: Number(data.level), is_active: true } });
      return NextResponse.json(r, { status: 201 });
    }
    return NextResponse.json({ message: 'Type tidak valid' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menyimpan' }, { status: 500 });
  }
}

// DELETE: delete one record by type and id
export async function DELETE(req: NextRequest) {
  const { type, id } = await req.json();
  try {
    if (type === 'expense') await prisma.expenseReference.delete({ where: { id: Number(id) } });
    else if (type === 'activity') await prisma.activityType.delete({ where: { id: Number(id) } });
    else if (type === 'account') await prisma.account.delete({ where: { id: Number(id) } });
    else if (type === 'role') await prisma.role.delete({ where: { id: Number(id) } });
    else return NextResponse.json({ message: 'Type tidak valid' }, { status: 400 });

    return NextResponse.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menghapus (mungkin masih digunakan)' }, { status: 500 });
  }
}

// PUT: update one record by type and id
export async function PUT(req: NextRequest) {
  const { type, id, ...data } = await req.json();
  const unit_id = data.unit_id ? Number(data.unit_id) : (data.unit_id === null ? null : undefined);
  const is_active = data.is_active !== undefined ? Boolean(data.is_active) : undefined;

  try {
    const updateData: any = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (unit_id !== undefined) updateData.unit_id = unit_id;
    
    // Hanya update nama/nomor/level jika dikirim (biasanya dari form Edit)
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.nomor !== undefined) updateData.nomor = data.nomor;
    if (data.nama_akun !== undefined) updateData.nama_akun = data.nama_akun;
    if (data.nama_jabatan !== undefined) updateData.nama_jabatan = data.nama_jabatan;
    if (data.level !== undefined) updateData.level = Number(data.level);

    if (type === 'expense') {
      await prisma.expenseReference.update({ where: { id: Number(id) }, data: updateData });
    } else if (type === 'activity') {
      await prisma.activityType.update({ where: { id: Number(id) }, data: updateData });
    } else if (type === 'account') {
      await prisma.account.update({ where: { id: Number(id) }, data: updateData });
    } else if (type === 'role') {
      await prisma.role.update({ where: { id: Number(id) }, data: updateData });
    } else {
      return NextResponse.json({ message: 'Type tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal memperbarui' }, { status: 500 });
  }
}
