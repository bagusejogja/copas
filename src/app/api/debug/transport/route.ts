import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const data = await prisma.expenseReference.findMany({
    where: { 
       OR: [
         { id: 2 },
         { nama: { contains: 'Transportasi' } }
       ]
    }
  });

  const vis = await prisma.masterVisibility.findMany({
    where: { reference_id: 2 }
  });

  return NextResponse.json({ data, visibility: vis });
}
