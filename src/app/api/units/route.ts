import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildUnitTree } from '@/lib/unit-hierarchy';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // 'tree' or 'flat' (default)

    const units = await prisma.unit.findMany({
      include: {
        parent_unit: { select: { id: true, nama_unit: true } },
        _count: { select: { child_units: true, users: true, proposals: true, programKerjas: true } }
      },
      orderBy: { id: 'asc' }
    });

    if (format === 'tree') {
      const tree = buildUnitTree(units, null);
      return NextResponse.json(tree);
    }

    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching units' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nama_unit, nama_unit_pendek, pemerhati, parent_unit_id, tipe } = await req.json();

    if (!nama_unit) {
      return NextResponse.json({ message: 'Nama unit wajib diisi' }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        nama_unit,
        nama_unit_pendek: nama_unit_pendek || null,
        pemerhati: pemerhati || null,
        tipe: tipe || 'UNIT',
        parent_unit_id: parent_unit_id ? Number(parent_unit_id) : null
      }
    });

    return NextResponse.json({ message: 'Unit berhasil ditambah', unit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating unit' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, nama_unit, nama_unit_pendek, pemerhati, parent_unit_id, tipe } = await req.json();

    if (!id || !nama_unit) {
      return NextResponse.json({ message: 'ID dan Nama unit wajib diisi' }, { status: 400 });
    }

    // Prevent setting parent to self or own descendant
    if (parent_unit_id === id) {
      return NextResponse.json({ message: 'Unit tidak boleh menjadi induk dari dirinya sendiri' }, { status: 400 });
    }

    const unit = await prisma.unit.update({
      where: { id: Number(id) },
      data: {
        nama_unit,
        nama_unit_pendek: nama_unit_pendek || null,
        pemerhati: pemerhati || null,
        tipe: tipe || 'UNIT',
        parent_unit_id: parent_unit_id ? Number(parent_unit_id) : null
      }
    });

    return NextResponse.json({ message: 'Unit berhasil diperbarui', unit });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating unit' }, { status: 500 });
  }
}
