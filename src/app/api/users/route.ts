import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        unit: true,
      },
      orderBy: { id: 'desc' },
      // Avoid sending raw passwords in response
    });
    
    // safe mapping without password
    const safeUsers = users.map(u => ({
       id: u.id,
       username: u.username,
       nama: u.nama,
       unit: u.unit,
       role: u.role
    }));
    
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, nama, unit_id, role_id } = await req.json();

    if (!username || !password || !nama || !unit_id || !role_id) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
        return NextResponse.json({ message: 'Username sudah digunakan!' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nama,
        unit_id: Number(unit_id),
        role_id: Number(role_id)
      }
    });

    return NextResponse.json({ message: 'User berhasil dibuat' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, nama, role_id, unit_id, password } = await req.json();
    const updateData: any = { nama, role_id: Number(role_id), unit_id: Number(unit_id) };
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({ where: { id: Number(id) }, data: updateData });
    return NextResponse.json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: 'User dihapus' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menghapus (mungkin masih memiliki data terkait)' }, { status: 500 });
  }
}
