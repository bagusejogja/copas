import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const flows = await prisma.approvalFlow.findMany({
    include: { role: true },
    orderBy: { urutan: 'asc' }
  });
  const roles = await prisma.role.findMany({ orderBy: { level: 'asc' } });
  return NextResponse.json({ flows, roles });
}

export async function POST(req: NextRequest) {
  const { role_id, label, urutan } = await req.json();
  const flow = await prisma.approvalFlow.create({
    data: { role_id: Number(role_id), label, urutan: Number(urutan), is_active: true }
  });
  return NextResponse.json(flow, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.approvalFlow.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: 'Langkah dihapus' });
}

export async function PUT(req: NextRequest) {
  const { id, is_active } = await req.json();
  const flow = await prisma.approvalFlow.update({
    where: { id: Number(id) },
    data: { is_active }
  });
  return NextResponse.json(flow);
}
