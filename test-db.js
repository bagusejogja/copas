const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Database connected:', result);
    
    console.log('Counting users...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
