import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  let userPayload: any = null;
  if (token) {
    userPayload = await verifyToken(token);
  }

  const payload: any = userPayload;
  const me = await prisma.user.findUnique({
    where: { id: payload?.id },
    include: { role: true }
  });
  const unit_id = Number(me?.unit_id || -1);

  // Helper untuk mencari ID yang diaktifkan di MasterVisibility
  const getVisibleIds = async (type: string) => {
    const list = await prisma.masterVisibility.findMany({
      where: { unit_id, reference_type: type, is_active: true },
      select: { reference_id: true }
    });
    const ids = list.map(l => l.reference_id);
    console.log(`[DEBUG PROPOSAL] Unit: ${unit_id}, Type: ${type}, Found Active IDs:`, ids);
    return ids;
  };

  const [expIds, actIds, accIds] = await Promise.all([
    getVisibleIds('expense'),
    getVisibleIds('activity'),
    getVisibleIds('account')
  ]);

  const [activities, expenses, accounts, prokers] = await Promise.all([
    prisma.activityType.findMany({ 
      where: { 
        is_active: true,
        OR: [{ unit_id }, { AND: [{ unit_id: null }, { id: { in: actIds } }] }]
      } 
    }),
    prisma.expenseReference.findMany({ 
      where: { 
        is_active: true,
        OR: [{ unit_id }, { AND: [{ unit_id: null }, { id: { in: expIds } }] }]
      } 
    }),
    prisma.account.findMany({ 
      where: { 
        is_active: true,
        OR: [{ unit_id }, { AND: [{ unit_id: null }, { id: { in: accIds } }] }]
      } 
    }),
    prisma.programKerja.findMany({ 
      where: { unit_id, is_active: true },
      include: {
        proposals: {
           where: { NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } } },
           include: { details: true }
        }
      }
    })
  ]);

  // Transform prokers to include current usage
  const prokersWithBudget = prokers.map(p => {
    const used = (p.proposals || []).reduce((sum, prop) => {
      return sum + prop.details.reduce((s, d) => s + Number(d.nominal), 0);
    }, 0);
    return {
      ...p,
      used_budget: used,
      remaining_budget: Number(p.anggaran_setahun) - used
    };
  });

  return NextResponse.json({ 
    activities, 
    expenses, 
    accounts, 
    prokers: prokersWithBudget,
    user: userPayload 
  });
}
