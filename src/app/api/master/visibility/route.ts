import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const refId = searchParams.get('refId');

  if (!type || !refId) return NextResponse.json({ message: 'Missing params' }, { status: 400 });

  const model = (prisma as any).masterVisibility || (prisma as any).MasterVisibility;
  if (!model) return NextResponse.json({ unitIds: [] });

  const activeUnits = await model.findMany({
    where: { reference_type: type, reference_id: Number(refId) },
    select: { unit_id: true }
  });

  return NextResponse.json({ unitIds: activeUnits.map((a: any) => a.unit_id) });
}

export async function POST(req: NextRequest) {
  try {
    const { type, refId, unitIds } = await req.json();
    const token = req.cookies.get('token')?.value;

    if (!type || !refId || !Array.isArray(unitIds) || !token) {
      return NextResponse.json({ message: 'Missing required data or token' }, { status: 400 });
    }

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Ambil data user dari DB
    const me = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true }
    });
    
    console.log("[VISIBILITY] User Access Check:", { 
      id: me?.id, 
      username: me?.username, 
      role: me?.role?.nama_jabatan, 
      level: me?.role?.level 
    });

    if (!me) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 401 });
    }

    const cleanUnitIds = (unitIds || []).map((id: any) => Number(id));
    const model = (prisma as any).masterVisibility || (prisma as any).MasterVisibility;
    if (!model) return NextResponse.json({ message: 'Model Error' }, { status: 500 });

    const isSuper = me.role.level >= 90;
    const myId = Number(me.unit_id);

    if (isSuper) {
      // Superadmin: Jika terpilih (isActive) -> Upsert Aktif. Jika tidak terpilih -> DELETE (Hilang dari unit).
      const allUnits = await prisma.unit.findMany({ select: { id: true } });
      await prisma.$transaction(
        allUnits.map(u => {
          const isActive = cleanUnitIds.includes(u.id);
          if (isActive) {
            return model.upsert({
              where: { reference_type_reference_id_unit_id: { reference_type: type, reference_id: Number(refId), unit_id: u.id } },
              update: { is_active: true },
              create: { reference_type: type, reference_id: Number(refId), unit_id: u.id, is_active: true }
            });
          } else {
            return model.deleteMany({
              where: { reference_type: type, reference_id: Number(refId), unit_id: u.id }
            });
          }
        })
      );
    } else {
      // Admin Unit: Ubah status is_active milik unitnya sendiri (JANGAN DIHAPUS agar centang Superadmin awet)
      const wantActive = cleanUnitIds.includes(myId);

      await model.upsert({
        where: { reference_type_reference_id_unit_id: { reference_type: type, reference_id: Number(refId), unit_id: myId } },
        update: { is_active: wantActive },
        create: { reference_type: type, reference_id: Number(refId), unit_id: myId, is_active: wantActive }
      });
    }

    return NextResponse.json({ message: 'Visibilitas diperbarui', success: true });
  } catch (error: any) {
    console.error("[API] Visibility Error:", error);
    return NextResponse.json({ message: 'Server Error', details: error.message }, { status: 500 });
  }
}
