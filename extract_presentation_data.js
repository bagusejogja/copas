const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stats = await prisma.proposal.groupBy({
    by: ['status_terakhir'],
    _count: true,
    _sum: { id: true } // just to get something to sum, actually we need nominal but it's in details
  });

  const totalUnits = await prisma.unit.count();
  const totalProposals = await prisma.proposal.count();
  const units = await prisma.unit.findMany({
      include: {
          _count: { select: { proposals: true } },
          paguRecords: { where: { tahun: 2024 } }
      }
  });

  const prokers = await prisma.programKerja.findMany({
      take: 5,
      select: { nama_kegiatan: true, anggaran_setahun: true }
  });

  console.log('--- ACTUAL APP DATA FOR PRESENTATION ---');
  console.log('Total Units:', totalUnits);
  console.log('Total Proposals:', totalProposals);
  console.log('Units Details:', JSON.stringify(units.map(u => ({ 
      name: u.nama_unit, 
      proposals: u._count.proposals,
      pagu: u.paguRecords[0]?.nominal || 0
  })), null, 2));
  console.log('Sample Prokers:', JSON.stringify(prokers, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
