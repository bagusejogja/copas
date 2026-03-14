import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: semua referensi (expense, activity, role, account)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get('unitId');
  const onlyActive = searchParams.get('onlyActive') === 'true';

  const whereClause = (uid: number | null) => {
    const clause: any = {};
    if (onlyActive) clause.is_active = true;
    if (uid) {
      clause.OR = [
        { unit_id: null },
        { unit_id: uid }
      ];
    }
    return clause;
  };

  const [expenses, activities, accounts, roles] = await Promise.all([
    prisma.expenseReference.findMany({ 
      where: whereClause(unitId ? Number(unitId) : null),
      orderBy: { id: 'asc' } 
    }),
    prisma.activityType.findMany({ 
      where: whereClause(unitId ? Number(unitId) : null),
      orderBy: { id: 'asc' } 
    }),
    prisma.account.findMany({ 
      where: whereClause(unitId ? Number(unitId) : null),
      orderBy: { id: 'asc' } 
    }),
    prisma.role.findMany({ 
      where: onlyActive ? { is_active: true } : {},
      orderBy: { level: 'asc' } 
    }),
  ]);
  return NextResponse.json({ expenses, activities, accounts, roles });
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
    const updateData: any = { is_active };
    if (unit_id !== undefined) updateData.unit_id = unit_id;

    if (type === 'expense') {
      await prisma.expenseReference.update({ where: { id: Number(id) }, data: { ...updateData, nama: data.nama } });
    } else if (type === 'activity') {
      await prisma.activityType.update({ where: { id: Number(id) }, data: { ...updateData, nama: data.nama } });
    } else if (type === 'account') {
      await prisma.account.update({ where: { id: Number(id) }, data: { ...updateData, nomor: data.nomor, nama_akun: data.nama_akun } });
    } else if (type === 'role') {
      await prisma.role.update({ where: { id: Number(id) }, data: { ...updateData, nama_jabatan: data.nama_jabatan, level: Number(data.level) } });
    } else {
      return NextResponse.json({ message: 'Type tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal memperbarui' }, { status: 500 });
  }
}
