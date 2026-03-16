const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing flow
  await prisma.approvalFlow.deleteMany({});
  
  // Add new flow 1, 3, 5
  const steps = [
    { urutan: 1, role_id: 1, label: 'Langkah 1: Penginput Usulan (Pengecekan Draft)' },
    { urutan: 2, role_id: 3, label: 'Langkah 2: Review Kantor Pusat (Verifikasi Anggaran)' },
    { urutan: 3, role_id: 5, label: 'Langkah 3: Bendahara (Approval Akhir & Kesiapan Dana)' }
  ];

  for (const step of steps) {
    await prisma.approvalFlow.create({ data: { ...step, is_active: true } });
  }

  console.log('Approval Flow successfully updated to [Role 1, Role 3, Role 5]');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
