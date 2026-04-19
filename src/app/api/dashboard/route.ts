import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getVisibleUnitIds } from '@/lib/unit-hierarchy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitIdParam = searchParams.get('unit_id');

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
    
    // Determine target units (hierarchical)
    let targetUnitIds: number[] = [];
    if (unitIdParam) {
      targetUnitIds = await getVisibleUnitIds(Number(unitIdParam));
    } else if (!isPusat && payload?.unit?.id) {
      targetUnitIds = await getVisibleUnitIds(payload.unit.id);
    }

    // Filters
    const prokerWhere: any = targetUnitIds.length > 0 ? { unit_id: { in: targetUnitIds } } : {};
    const proposalWhere: any = { 
      NOT: { status_terakhir: 'DRAFT' },
      ...(targetUnitIds.length > 0 ? { unit_id: { in: targetUnitIds } } : {})
    };
    const unitFilter: any = targetUnitIds.length > 0 ? { id: { in: targetUnitIds } } : {};

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
            where: { NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } } },
            include: { details: true, pertanggungjawabans: true }
          }
        },
        orderBy: { id: 'asc' },
        take: 50
      }).catch(() => []),
      prisma.proposal.findMany({
        where: proposalWhere,
        include: {
          details: true,
          pertanggungjawabans: true,
          activity_type: true
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

    const monthlyChart = Array.from({ length: 12 }, () => ({
      pengajuan: 0,
      disetujui: 0,
      spj: 0
    }));

    allProposals.forEach((p: any) => {
      const nominal = (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0);
      totalNominalDiajukan += nominal;
      if (pendingStatuses.includes(p.status_terakhir)) totalNominalPending += nominal;
      if (finalStatuses.includes(p.status_terakhir)) totalNominalFinal += nominal;
      if (p.status_terakhir === 'PAID') totalNominalPaid += nominal;

      // Grouping per Month
      if (p.tanggal) {
        const month = new Date(p.tanggal).getMonth(); 
        monthlyChart[month].pengajuan += nominal;
        if (finalStatuses.includes(p.status_terakhir)) {
           monthlyChart[month].disetujui += nominal;
        }
        const totalSpj = (p.pertanggungjawabans || []).reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0);
        monthlyChart[month].spj += totalSpj;
      }
    });

    console.log("Processing unit summary...");
    const unitSummary = await Promise.all((units || []).map(async (u: any) => {
      const descendantIds = await getVisibleUnitIds(u.id);
      const subProposals = allProposals.filter((p: any) => descendantIds.includes(p.unit_id));
      
      const diajukan = subProposals.length;
      const totalAnggaran = subProposals.reduce((sum: number, p: any) =>
        sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
      );
      const totalDisetujui = subProposals
        .filter((p: any) => finalStatuses.includes(p.status_terakhir))
        .reduce((sum: number, p: any) =>
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );
      // Indikator split SPJ logic

      const totalSPJVerified = subProposals
        .reduce((sum: number, p: any) => 
          sum + (p.pertanggungjawabans?.filter((lpj: any) => 
            lpj.status?.startsWith('APPROVE') || 
            lpj.status === 'PAID' || 
            lpj.status === 'SELESAI' // Jaga-jaga kalau ada status 'SELESAI'
          ).reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
        );
      const totalSPJProcess = subProposals
        .reduce((sum: number, p: any) => 
          sum + (p.pertanggungjawabans?.filter((lpj: any) => 
            lpj.status === 'SUBMITTED' || 
            lpj.status === 'REVIEW' // Jaga-jaga kalau ada status 'REVIEW'
          ).reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
        );

      const currentYear = new Date().getFullYear();
      
      // 1. Pagu Jatah (Allocated)
      const allPagus = await prisma.unitPagu.aggregate({
        where: { unit_id: { in: descendantIds }, tahun: currentYear },
        _sum: { nominal: true }
      });
      const consolidatedPagu = Number(allPagus._sum?.nominal || 0);

      // 2. Pagu Proker (Sum of ProgramKerja anggaran)
      const prokerPaguDist = await prisma.programKerja.aggregate({
        where: { unit_id: { in: descendantIds } },
        _sum: { anggaran_setahun: true }
      });
      const totalPaguProker = Number(prokerPaguDist._sum?.anggaran_setahun || 0);

      return {
        id: u.id,
        nama_unit: u.nama_unit,
        tipe: u.tipe,
        parent_unit_id: u.parent_unit_id,
        diajukan,
        totalAnggaran,
        totalDisetujui,
        totalSPJ: totalSPJVerified, // Tetap gunakan nama ini untuk kompatibilitas, tapi isinya verified
        totalSPJProcess,
        consolidatedPagu,
        totalPaguProker
      };
    }));

    const unitSummaryFiltered = unitSummary.filter((u: any) => {
      return u.id === 1 || u.diajukan > 0 || u.consolidatedPagu > 0 || u.totalPaguProker > 0;
    });

    // stats level unit pagu
    const curYear = new Date().getFullYear();
    const globalUnitPagu = await prisma.unitPagu.aggregate({
      where: prokerWhere.unit_id ? { unit_id: prokerWhere.unit_id } : {},
      _sum: { nominal: true }
    });

    console.log("Fetching proker data...");
    const prokerData = await prisma.programKerja.findMany({
      where: prokerWhere,
      include: {
        unit: true,
        proposals: {
          where: {
            NOT: { status_terakhir: { in: ['DRAFT', 'REJECTED'] } }
          },
          include: { 
             details: true,
             pertanggungjawabans: true 
          }
        }
      },
      orderBy: [{ unit_id: 'asc' }, { id: 'asc' }]
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
        sum + (p.pertanggungjawabans?.filter((lpj: any) => lpj.status?.startsWith('APPROVE') || lpj.status === 'PAID' || lpj.status === 'SELESAI').reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
      );
      
      return {
        id: pk.id,
        unit_id: pk.unit_id,
        unit_nama: pk.unit?.nama_unit || '-',
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

    // Calculate true global SPJ stats
    const totalNominalSPJVerified = allProposals.reduce((sum: number, p: any) => 
      sum + (p.pertanggungjawabans?.filter((lpj: any) => 
        lpj.status?.startsWith('APPROVE') || 
        lpj.status === 'PAID' || 
        lpj.status === 'SELESAI'
      ).reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
    );
    const totalNominalSPJProcess = allProposals.reduce((sum: number, p: any) => 
      sum + (p.pertanggungjawabans?.filter((lpj: any) => 
        lpj.status === 'SUBMITTED' || 
        lpj.status === 'REVIEW'
      ).reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
    );

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
        totalNominalSPJ: totalNominalSPJVerified,
        totalNominalSPJProcess: totalNominalSPJProcess,
        totalAnggaranSetahun, // Ini Pagu Proker Total
        totalUnitPagu: Number(globalUnitPagu._sum?.nominal || 0) // Ini Total Jatah 1M x Unit
      },
      unitSummary: unitSummaryFiltered,
      prokerSummary,
      recentProposals,
      monthlyChart
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
