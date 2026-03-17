const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const units = await prisma.unit.findMany({ take: 1 });
    console.log('Koneksi Database OK. Data unit:', units);
  } catch (error) {
    console.error('Koneksi Database GAGAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
