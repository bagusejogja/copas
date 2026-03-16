const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.unit.updateMany({
    where: {
      nama_unit: {
        contains: 'Kantor Pusat Muhammadiyah'
      }
    },
    data: {
      nama_unit: 'PDM Kota Jogja'
    }
  });
  console.log(`Updated ${result.count} units.`);

  const result2 = await prisma.programKerja.updateMany({
    where: {
      nama_kegiatan: {
        contains: 'Kantor Pusat Muhammadiyah'
      }
    },
    data: {
      nama_kegiatan: 'PDM Kota Jogja'
    }
  });
  console.log(`Updated ${result2.count} prokers.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
