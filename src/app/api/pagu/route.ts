import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    // Admin or Central Unit can see all
    const isPusat = payload?.role?.level === 99 || payload?.unit?.id === 1;

    const units = await prisma.unit.findMany({
      where: isPusat ? {} : { id: payload?.unit?.id },
      include: {
        paguRecords: {
          orderBy: { tahun: 'desc' }
        },
        _count: {
          select: { programKerjas: true }
        }
      }
    });

    return NextResponse.json(units);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    if (payload?.role?.level !== 99 && payload?.unit?.id !== 1) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { unit_id, tahun, nominal } = await req.json();

    const pagu = await prisma.unitPagu.upsert({
      where: {
        unit_id_tahun: {
          unit_id: Number(unit_id),
          tahun: Number(tahun)
        }
      },
      update: { nominal: Number(nominal) },
      create: {
        unit_id: Number(unit_id),
        tahun: Number(tahun),
        nominal: Number(nominal)
      }
    });

    return NextResponse.json(pagu);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
