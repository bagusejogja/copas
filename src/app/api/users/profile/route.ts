import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const payload: any = await verifyToken(token);
    const userId = payload.id;
    
    const body = await req.json();
    const { nama, nbm, password } = body;

    const updateData: any = {
      nama,
      nbm: nbm || null,
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, nama: true, nbm: true }
    });

    return NextResponse.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || 'Error updating profile' }, { status: 500 });
  }
}
