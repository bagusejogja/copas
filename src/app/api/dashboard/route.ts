import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  console.log("Dashboard API called"); // Logging for debugging
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let payload: any = null;
    
    if (token) {
      try {
        payload = await verifyToken(token);
      } catch (e) {
        console.error("Token verification failed", e);
      }
    }

    // Role check
    const isPusat = !payload || (payload.role && payload.role.level === 99) || (payload.unit && payload.unit.id === 1);
    
    // Filters
    const prokerWhere = isPusat ? {} : { unit_id: payload?.unit?.id };
    const proposalWhere = isPusat ? { NOT: { status_terakhir: 'DRAFT' } } : { unit_id: payload?.unit?.id, NOT: { status_terakhir: 'DRAFT' } };
    const unitFilter = isPusat ? {} : { id: payload?.unit?.id };

    // 3. Ambil Nama semua dynamic steps untuk filter PENDING
    const flows = await prisma.approvalFlow.findMany({ where: { is_active: true } });
    const dynamicPendingTags = flows.map(f => `APPROVED_STEP_${f.id}`);
    const pendingStatuses = ['PENDING', ...dynamicPendingTags];
    const finalStatuses = ['APPROVED_FINAL', 'PAID'];

    // Stats with safety
    const [totalUsulanCount, pendingUsulanCount, approvedFinalCount, paidUsulanCount, totalUsers, units, allProposals, allProkerBudgets]: any[] = await Promise.all([
      prisma.proposal.count({ where: proposalWhere }).catch(() => 0),
      prisma.proposal.count({ where: { ...proposalWhere, status_terakhir: { in: pendingStatuses } } }).catch(() => 0),
      prisma.proposal.count({ where: { ...proposalWhere, status_terakhir: { in: finalStatuses } } }).catch(() => 0),
      prisma.proposal.count({ where: { ...proposalWhere, status_terakhir: 'PAID' } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.unit.findMany({
        where: unitFilter,
        include: {
          proposals: {
            where: isPusat ? { NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } } } : { unit_id: payload?.unit?.id, NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } } },
            select: {
              status_terakhir: true,
              details: { select: { nominal: true } },
              pertanggungjawabans: { 
                where: { status: 'APPROVED_FINAL' },
                select: { total_realisasi: true } 
              }
            }
          }
        },
        orderBy: { id: 'asc' },
        take: 50 // Increased for consolidation
      }).catch(() => []),
      prisma.proposal.findMany({
        where: proposalWhere,
        select: {
          status_terakhir: true,
          details: { select: { nominal: true } }
        }
      }).catch(() => []),
      prisma.programKerja.aggregate({
        where: prokerWhere,
        _sum: { anggaran_setahun: true }
      }).catch(() => ({ _sum: { anggaran_setahun: 0 } }))
    ]);

    const totalAnggaranSetahun = Number(allProkerBudgets._sum?.anggaran_setahun || 0);

    // Calculate totals in IDR
    let totalNominalDiajukan = 0;
    let totalNominalPending = 0;
    let totalNominalFinal = 0;
    let totalNominalPaid = 0;

    allProposals.forEach((p: any) => {
      const nominal = (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0);
      totalNominalDiajukan += nominal;
      if (pendingStatuses.includes(p.status_terakhir)) totalNominalPending += nominal;
      if (finalStatuses.includes(p.status_terakhir)) totalNominalFinal += nominal;
      if (p.status_terakhir === 'PAID') totalNominalPaid += nominal;
    });

    console.log("Processing unit summary...");
    const unitSummary = (units || []).map((u: any) => {
      const diajukan = (u.proposals || []).length;
      
      const totalAnggaran = (u.proposals || []).reduce((sum: number, p: any) =>
        sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
      );
      
      const totalDisetujui = (u.proposals || [])
        .filter((p: any) => finalStatuses.includes(p.status_terakhir))
        .reduce((sum: number, p: any) =>
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );

      const totalSPJ = (u.proposals || [])
        .reduce((sum: number, p: any) => 
          sum + (p.pertanggungjawabans?.filter((lpj: any) => lpj.status === 'APPROVED_FINAL').reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
        );

      return { 
        id: u.id, 
        nama_unit: u.nama_unit || u.nama, 
        diajukan, 
        totalAnggaran, 
        totalDisetujui, 
        totalSPJ 
      };
    }).filter((u: any) => u.diajukan > 0);

    console.log("Fetching proker data...");
    const prokerData = await prisma.programKerja.findMany({
      where: prokerWhere,
      include: {
        proposals: {
          where: {
            NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } }
          },
          include: { 
             details: true,
             pertanggungjawabans: true 
          }
        }
      }
    }).catch(() => []);

    const prokerSummary = (prokerData || []).map((pk: any) => {
      const anggaran = Number(pk.anggaran_setahun || 0);
      const diajukanRow = (pk.proposals || []).reduce((sum: number, p: any) => 
        sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
      );
      const disetujuiRow = (pk.proposals || [])
        .filter((p: any) => ['APPROVED_FINAL', 'PAID'].includes(p.status_terakhir))
        .reduce((sum: number, p: any) => 
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );
      const diambilRow = (pk.proposals || [])
        .filter((p: any) => p.status_terakhir === 'PAID')
        .reduce((sum: number, p: any) => 
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );
      const dilaporkanRow = (pk.proposals || []).reduce((sum: number, p: any) => 
        sum + (p.pertanggungjawabans?.filter((lpj: any) => lpj.status === 'APPROVED_FINAL').reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
      );
      
      const sisa = anggaran - disetujuiRow;
      
      return {
        id: pk.id,
        nama_kegiatan: pk.nama_kegiatan,
        anggaran,
        diajukan: diajukanRow,
        disetujui: disetujuiRow,
        diambil: diambilRow,
        dilaporkan: dilaporkanRow,
        sisa: anggaran - disetujuiRow
      };
    });

    const recentProposals = await prisma.proposal.findMany({
      where: proposalWhere,
      orderBy: { id: 'desc' },
      take: 6,
      include: { activity_type: true, unit: true }
    }).catch(() => []);

    console.log("Dashboard API Success");
    return NextResponse.json({
      stats: { 
        totalUsulan: totalUsulanCount, 
        pendingUsulan: pendingUsulanCount, 
        approvedFinal: approvedFinalCount, 
        paidUsulan: paidUsulanCount,
        totalUsers,
        totalNominalDiajukan,
        totalNominalPending,
        totalNominalFinal,
        totalNominalPaid,
        totalAnggaranSetahun
      },
      unitSummary,
      prokerSummary,
      recentProposals
    });
  } catch (error: any) {
    console.error("CRITICAL DASHBOARD ERROR:", error);
    return NextResponse.json({ 
        error: 'Error fetching dashboard data', 
        message: error.message,
        stats: { totalUsulan: 0, pendingUsulan: 0, approvedFinal: 0, totalUsers: 0 },
        unitSummary: [],
        prokerSummary: [],
        recentProposals: []
    }, { status: 500 });
  }
}
