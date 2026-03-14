const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient({});
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Mulai proses seeding data Master & User...');

  // --- 1. Seeding Jabatan / Roles ---
  const rolesData = [
    { id: 1, nama_jabatan: 'Penginput Usulan Unit', level: 1 },
    { id: 2, nama_jabatan: 'Atasan Penginput', level: 2 },
    { id: 3, nama_jabatan: 'Review Kantor Pusat', level: 3 },
    { id: 4, nama_jabatan: 'Approval Kantor Pusat', level: 4 },
    { id: 5, nama_jabatan: 'Bendahara', level: 5 },
    { id: 99, nama_jabatan: 'Administrator', level: 99 },
  ];

  for (const role of rolesData) {
    const existingRole = await prisma.role.findFirst({ where: { id: role.id } });
    if (!existingRole) {
      await prisma.role.create({ data: role });
    }
  }

  // --- 2. Seeding Unit Kerja Muhammadiyah ---
  const unitsData = [
    { id: 1, nama_unit: 'Kantor Pusat Muhammadiyah', parent_unit_id: null }, // Unit Induk
    { id: 2, nama_unit: 'Majelis Tarjih dan Tajdid (MTT)', parent_unit_id: 1 },
    { id: 3, nama_unit: 'Majelis Tabligh (MT)', parent_unit_id: 1 },
    { id: 4, nama_unit: 'Majelis Pendidikan Dasar Menengah dan Pendidikan Nonformal', parent_unit_id: 1 },
    { id: 5, nama_unit: 'Majelis Pendidikan Kader dan Sumber Daya Insani (MPKSDI)', parent_unit_id: 1 },
    { id: 6, nama_unit: 'Majelis Pembinaan Kesehatan Umum (MPKU)', parent_unit_id: 1 },
    { id: 7, nama_unit: 'Majelis Pembinaan Kesejahteraan Sosial (MPKS)', parent_unit_id: 1 },
    { id: 8, nama_unit: 'Majelis Ekonomi, Bisnis, dan Pariwisata (MEBP)', parent_unit_id: 1 },
    { id: 9, nama_unit: 'Majelis Pendayagunaan Wakaf (MPW)', parent_unit_id: 1 },
    { id: 10, nama_unit: 'Majelis Pemberdayaan Masyarakat (MPM)', parent_unit_id: 1 },
    { id: 11, nama_unit: 'Majelis Hukum dan Hak Asasi Manusia (MHH)', parent_unit_id: 1 },
    { id: 12, nama_unit: 'Majelis Lingkungan Hidup (MLH)', parent_unit_id: 1 },
    { id: 13, nama_unit: 'Lembaga Pengembangan Pesantren (LPP)', parent_unit_id: 1 },
    { id: 14, nama_unit: 'Lembaga Pengembangan Cabang Ranting dan Pembinaan Masjid', parent_unit_id: 1 },
    { id: 15, nama_unit: 'Lembaga Pembinaan dan Pengawasan Keuangan (LPPK)', parent_unit_id: 1 },
    { id: 16, nama_unit: 'Lembaga Resiliensi Bencana (LRB)', parent_unit_id: 1 },
    { id: 17, nama_unit: 'Lembaga Amil Zakat, Infak, dan Sedekah (LAZIS)', parent_unit_id: 1 },
    { id: 18, nama_unit: 'Lembaga Pengembangan Usaha Mikro Kecil Menengah (LPUMKM)', parent_unit_id: 1 },
    { id: 19, nama_unit: 'Lembaga Hikmah dan Kebijakan Publik (LHKP)', parent_unit_id: 1 },
    { id: 20, nama_unit: 'Lembaga Seni Budaya (LSB)', parent_unit_id: 1 },
    { id: 21, nama_unit: 'Lembaga Pengembangan Olahraga (LPO)', parent_unit_id: 1 },
    { id: 22, nama_unit: 'Lembaga Pembinaan Haji dan Umroh (LPHU)', parent_unit_id: 1 },
  ];

  for (const unit of unitsData) {
    const existingUnit = await prisma.unit.findFirst({ where: { id: unit.id } });
    if (!existingUnit) {
      await prisma.unit.create({ data: unit });
    }
  }

  // --- 3. Seeding User Dummy ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const usersData = [
    { username: 'admin', password: hashedPassword, nama: 'Administrator System', unit_id: 1, role_id: 99 },
    { username: 'input_mt', password: hashedPassword, nama: 'Staf Input Majelis Tabligh', unit_id: 3, role_id: 1 },
    { username: 'atasan_mt', password: hashedPassword, nama: 'Ketua Majelis Tabligh', unit_id: 3, role_id: 2 },
    { username: 'review_pusat', password: hashedPassword, nama: 'Tim Review Kantor Pusat', unit_id: 1, role_id: 3 },
    { username: 'approval_pusat', password: hashedPassword, nama: 'Pimpinan Kantor Pusat', unit_id: 1, role_id: 4 },
    { username: 'bendahara', password: hashedPassword, nama: 'Bendahara Pusat', unit_id: 1, role_id: 5 },
  ];

  for (const u of usersData) {
    const existingUser = await prisma.user.findUnique({ where: { username: u.username } });
    if (!existingUser) {
      await prisma.user.create({ data: u });
    }
  }

  console.log('Seeding Selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
