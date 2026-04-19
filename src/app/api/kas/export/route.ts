import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterUnit = searchParams.get('unit_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const isAdmin = payload.role.level === 99 || payload.role.id === 5;
    
    let whereClause: any = {};
    if (filterUnit) {
      if (isAdmin || payload.unit.id === 1) {
        whereClause.unit_id = Number(filterUnit);
      } else {
        whereClause.unit_id = payload.unit?.id;
      }
    } else {
      whereClause.unit_id = payload.unit?.id;
    }

    if (from || to) {
      whereClause.tanggal = {};
      if (from) whereClause.tanggal.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.tanggal.lte = toDate;
      }
    }

    const records = await prisma.kas.findMany({
      where: whereClause,
      orderBy: { tanggal: 'asc' },
      include: { proposal: { select: { judul: true } } }
    });

    // Build Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Buku Kas');

    // Title
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BUKU KAS - SISTEM ANGGARAN MUHAMMADIYAH';
    titleCell.font = { name: 'Arial', size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:G2');
    const periodCell = sheet.getCell('A2');
    periodCell.value = `Periode: ${from || 'Awal'} s.d. ${to || 'Sekarang'}`;
    periodCell.font = { name: 'Arial', size: 10, italic: true };
    periodCell.alignment = { horizontal: 'center' };

    // Headers
    const headerRow = sheet.addRow([]);
    const headers = ['No', 'Tanggal', 'Keterangan', 'Kategori', 'Debit (Masuk)', 'Kredit (Keluar)', 'Saldo'];
    const hRow = sheet.addRow(headers);
    hRow.eachCell(cell => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    hRow.height = 24;

    // Column widths
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 45;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 20;
    sheet.getColumn(6).width = 20;
    sheet.getColumn(7).width = 22;

    let saldo = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    records.forEach((r: any, i: number) => {
      const nominal = Number(r.nominal);
      const masuk = r.tipe === 'MASUK' ? nominal : 0;
      const keluar = r.tipe === 'KELUAR' ? nominal : 0;
      saldo += masuk - keluar;
      totalMasuk += masuk;
      totalKeluar += keluar;

      const row = sheet.addRow([
        i + 1,
        new Date(r.tanggal).toLocaleDateString('id-ID'),
        r.deskripsi + (r.proposal ? ` (Ref: ${r.proposal.judul})` : ''),
        r.kategori || 'umum',
        masuk || '',
        keluar || '',
        saldo
      ]);

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
        if (colNumber >= 5) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
        if (colNumber === 5 && masuk > 0) cell.font = { name: 'Arial', size: 10, color: { argb: 'FF059669' } };
        if (colNumber === 6 && keluar > 0) cell.font = { name: 'Arial', size: 10, color: { argb: 'FFDC2626' } };
        if (colNumber === 7) cell.font = { name: 'Arial', size: 10, bold: true };
      });

      if (i % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
    });

    // Footer totals
    const footerRow = sheet.addRow(['', '', '', 'TOTAL', totalMasuk, totalKeluar, saldo]);
    footerRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 11, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'medium' }, bottom: { style: 'medium' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
      if (colNumber >= 5) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="buku-kas.xlsx"`
      }
    });
  } catch (error: any) {
    console.error("KAS EXPORT ERROR:", error);
    return NextResponse.json({ message: error.message || 'Error exporting Kas' }, { status: 500 });
  }
}
