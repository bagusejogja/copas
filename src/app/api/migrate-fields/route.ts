import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint sementara untuk migrasi kolom baru ke DB live
// Akses: GET /api/migrate-fields
export async function GET() {
  const results: string[] = [];
  
  try {
    // Cek apakah kolom sudah ada sebelum menambah (agar bisa dipanggil berulang)
    
    // 1. Unit: nama_unit_pendek
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`Unit\` ADD COLUMN \`nama_unit_pendek\` VARCHAR(191) NULL`);
      results.push('✅ Unit.nama_unit_pendek berhasil ditambahkan');
    } catch (e: any) {
      if (e.message?.includes('Duplicate column')) results.push('⚠️ Unit.nama_unit_pendek sudah ada (skip)');
      else results.push(`❌ Unit.nama_unit_pendek error: ${e.message}`);
    }

    // 2. Unit: pemerhati
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`Unit\` ADD COLUMN \`pemerhati\` VARCHAR(191) NULL`);
      results.push('✅ Unit.pemerhati berhasil ditambahkan');
    } catch (e: any) {
      if (e.message?.includes('Duplicate column')) results.push('⚠️ Unit.pemerhati sudah ada (skip)');
      else results.push(`❌ Unit.pemerhati error: ${e.message}`);
    }

    // 3. User: nbm
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`User\` ADD COLUMN \`nbm\` VARCHAR(191) NULL`);
      results.push('✅ User.nbm berhasil ditambahkan');
    } catch (e: any) {
      if (e.message?.includes('Duplicate column')) results.push('⚠️ User.nbm sudah ada (skip)');
      else results.push(`❌ User.nbm error: ${e.message}`);
    }

    // 4. ProgramKerja: keterangan
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`ProgramKerja\` ADD COLUMN \`keterangan\` TEXT NULL`);
      results.push('✅ ProgramKerja.keterangan berhasil ditambahkan');
    } catch (e: any) {
      if (e.message?.includes('Duplicate column')) results.push('⚠️ ProgramKerja.keterangan sudah ada (skip)');
      else results.push(`❌ ProgramKerja.keterangan error: ${e.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migrasi selesai!', 
      details: results 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: results
    }, { status: 500 });
  }
}
