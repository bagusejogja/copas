import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  let userPayload: any = null;
  if (token) {
    userPayload = await verifyToken(token);
  }

  const unit_id = userPayload?.unit?.id;

  const whereClause = {
    is_active: true,
    OR: [
      { unit_id: null },
      { unit_id: unit_id ? Number(unit_id) : -1 }
    ]
  };

  const [activities, expenses, accounts, prokers] = await Promise.all([
    prisma.activityType.findMany({ where: whereClause }),
    prisma.expenseReference.findMany({ where: whereClause }),
    prisma.account.findMany({ where: whereClause }),
    prisma.programKerja.findMany({ 
      where: { unit_id: unit_id ? Number(unit_id) : -1, is_active: true },
      include: {
        proposals: {
           include: { details: true }
        }
      }
    })
  ]);

  // Transform prokers to include current usage
  const prokersWithBudget = prokers.map(p => {
    const used = p.proposals.reduce((sum, prop) => {
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
