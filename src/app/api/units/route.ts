import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      include: {
        parent_unit: true,
      },
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching units' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nama_unit, nama_unit_pendek, pemerhati, parent_unit_id } = await req.json();

    if (!nama_unit) {
      return NextResponse.json({ message: 'Nama unit wajib diisi' }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        nama_unit,
        nama_unit_pendek: nama_unit_pendek || null,
        pemerhati: pemerhati || null,
        parent_unit_id: parent_unit_id ? Number(parent_unit_id) : null
      }
    });

    return NextResponse.json({ message: 'Unit berhasil ditambah', unit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating unit' }, { status: 500 });
  }
}
