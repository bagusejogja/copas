import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username & Password harus diisi!' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, unit: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Username tidak ditemukan' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Password salah!' }, { status: 401 });
    }

    // Buat JWT Token
    const payload = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: { id: user.role.id, nama: user.role.nama_jabatan, level: user.role.level },
      unit: { id: user.unit.id, nama: user.unit.nama_unit }
    };
    const token = await signToken(payload);

    // Set cookie
    const response = NextResponse.json({ message: 'Login berhasil!', user: payload });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 hari
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
