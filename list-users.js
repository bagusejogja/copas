const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
        include: { role: true, unit: true }
    });
    console.log('Users:');
    users.forEach(u => {
        console.log(`- ${u.username} (${u.nama}) | Role: ${u.role.nama_jabatan} (Level: ${u.role.level}) | Unit: ${u.unit.nama_unit}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
