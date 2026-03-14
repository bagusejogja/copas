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
    const whereClause = isPusat ? {} : { unit_id: payload?.unit?.id };
    const unitFilter = isPusat ? {} : { id: payload?.unit?.id };

    console.log("Fetching dashboard stats...", { isPusat, whereClause });

    // Stats with safety
    const [totalUsulan, pendingUsulan, approvedFinal, totalUsers, units] = await Promise.all([
      prisma.proposal.count({ where: whereClause }).catch(() => 0),
      prisma.proposal.count({ where: { ...whereClause, status_terakhir: 'PENDING' } }).catch(() => 0),
      prisma.proposal.count({ where: { ...whereClause, status_terakhir: 'APPROVED_FINAL' } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.unit.findMany({
        where: unitFilter,
        include: {
          _count: { select: { proposals: true } },
          proposals: {
            where: isPusat ? {} : { unit_id: payload?.unit?.id },
            select: {
              status_terakhir: true,
              details: { select: { nominal: true } },
              pertanggungjawabans: { select: { total_realisasi: true } }
            }
          }
        },
        orderBy: { id: 'asc' },
        take: 20
      }).catch(() => [])
    ]);

    console.log("Processing unit summary...");
    const unitSummary = (units || []).map((u: any) => {
      const diajukan = u._count?.proposals || 0;
      const disetujui_count = (u.proposals || []).filter((p: any) => p.status_terakhir === 'APPROVED_FINAL').length;
      
      const totalAnggaran = (u.proposals || []).reduce((sum: number, p: any) =>
        sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
      );
      
      const totalDisetujui = (u.proposals || [])
        .filter((p: any) => p.status_terakhir === 'APPROVED_FINAL')
        .reduce((sum: number, p: any) =>
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );

      const totalSPJ = (u.proposals || [])
        .reduce((sum: number, p: any) => 
          sum + (p.pertanggungjawabans?.reduce((s: number, lpj: any) => s + Number(lpj.total_real_isasi || lpj.total_realisasi || 0), 0) || 0), 0
        );

      return { 
        id: u.id, 
        nama_unit: u.nama_unit || u.nama, 
        diajukan, 
        disetujui: disetujui_count, 
        totalAnggaran, 
        totalDisetujui, 
        totalSPJ 
      };
    }).filter((u: any) => u.diajukan > 0);

    console.log("Fetching proker data...");
    const prokerData = await prisma.programKerja.findMany({
      where: whereClause,
      include: {
        proposals: {
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
        .filter((p: any) => p.status_terakhir === 'APPROVED_FINAL')
        .reduce((sum: number, p: any) => 
          sum + (p.details || []).reduce((s: number, d: any) => s + Number(d.nominal || 0), 0), 0
        );
      const dilaporkanRow = (pk.proposals || []).reduce((sum: number, p: any) => 
        sum + (p.pertanggungjawabans?.reduce((s: number, lpj: any) => s + Number(lpj.total_realisasi || 0), 0) || 0), 0
      );
      
      const sisa = anggaran - disetujuiRow;
      
      return {
        id: pk.id,
        nama_kegiatan: pk.nama_kegiatan,
        anggaran,
        diajukan: diajukanRow,
        disetujui: disetujuiRow,
        diambil: disetujuiRow,
        dilaporkan: dilaporkanRow,
        sisa
      };
    });

    const recentProposals = await prisma.proposal.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      take: 6,
      include: { activity_type: true, unit: true }
    }).catch(() => []);

    console.log("Dashboard API Success");
    return NextResponse.json({
      stats: { totalUsulan, pendingUsulan, approvedFinal, totalUsers },
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
