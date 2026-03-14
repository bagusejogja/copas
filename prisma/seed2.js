const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Data Referensi (Jenis Kegiatan, Referensi Pengeluaran, Akun)...');

  const activities = [
    { nama: 'Rapat Kerja Nasional' },
    { nama: 'Pelatihan Kader' },
    { nama: 'Bakti Sosial' },
    { nama: 'Pengadaan Barang & Jasa' },
    { nama: 'Operasional Rutin' }
  ];

  for (const a of activities) {
    const exists = await prisma.activityType.findFirst({ where: { nama: a.nama } });
    if (!exists) await prisma.activityType.create({ data: a });
  }

  const expenses = [
    { nama: 'Biaya Konsumsi' },
    { nama: 'Biaya Transportasi & Akomodasi' },
    { nama: 'Biaya Sewa Tempat/Alat' },
    { nama: 'Honorarium Narasumber' },
    { nama: 'Pembelian Material Alat Tulis' }
  ];

  for (const e of expenses) {
    const exists = await prisma.expenseReference.findFirst({ where: { nama: e.nama } });
    if (!exists) await prisma.expenseReference.create({ data: e });
  }

  const accounts = [
    { nomor: '5.1.1.01', nama_akun: 'Beban Operasional Pelayanan' },
    { nomor: '5.1.2.01', nama_akun: 'Beban Publikasi & Cetak' },
    { nomor: '5.1.3.01', nama_akun: 'Beban ATK & Fotokopi' },
    { nomor: '5.2.1.01', nama_akun: 'Beban Rapat & Konsumsi' },
  ];

  for (const acc of accounts) {
    const exists = await prisma.account.findFirst({ where: { nomor: acc.nomor } });
    if (!exists) await prisma.account.create({ data: acc });
  }

  console.log('Selesai Seeding Referensi Form Usulan!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
