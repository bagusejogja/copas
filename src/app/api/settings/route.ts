import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.globalSetting.findMany();
    // Convert to object
    const map = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    return NextResponse.json(map);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    if (payload?.role?.level !== 99) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json(); // { key, value }

    const setting = await prisma.globalSetting.upsert({
      where: { key: body.key },
      update: { value: body.value },
      create: { key: body.key, value: body.value }
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
