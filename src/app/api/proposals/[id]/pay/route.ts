import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload: any = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Cek Role Bendahara (id 5 atau level 99/admin)
    const isBendahara = payload.role.id === 5 || payload.role.level === 99;
    if (!isBendahara) {
      return NextResponse.json({ message: 'Hanya Bendahara yang dapat memproses pembayaran' }, { status: 403 });
    }

    const body = await req.json();
    const { tanggal_bayar, nominal, deskripsi } = body;

    if (!tanggal_bayar) {
      return NextResponse.json({ message: 'Tanggal bayar wajib diisi' }, { status: 400 });
    }

    const proposalId = Number(id);

    // Gunakan Transaction untuk update proposal dan buat record Kas
    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findUnique({
        where: { id: proposalId },
        include: { details: true, unit: true }
      });

      if (!proposal) throw new Error('Proposal tidak ditemukan');
      if (proposal.status_terakhir !== 'APPROVED_FINAL') {
        throw new Error('Hanya proposal dengan status APPROVED_FINAL yang dapat dibayar');
      }

      // 1. Update Proposal
      const updatedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status_terakhir: 'PAID',
          tanggal_bayar: new Date(tanggal_bayar),
          dibayar_oleh_id: payload.id
        }
      });

      // 2. Buat Record Kas (Keluar)
      const totalProposal = proposal.details.reduce((sum, d) => sum + Number(d.nominal), 0);
      const payNominal = nominal ? Number(nominal) : totalProposal;

      await tx.kas.create({
        data: {
          tanggal: new Date(tanggal_bayar),
          proposal_id: proposalId,
          tipe: 'KELUAR',
          kategori: 'Usulan Anggaran',
          deskripsi: deskripsi || `Pembayaran usulan: ${proposal.judul}`,
          nominal: payNominal,
          unit_id: 1 // Selalu kurangi Kas PDM (Unit ID 1) saat pembayaran usulan pusat
        }
      });

      return updatedProposal;
    });

    return NextResponse.json({ message: 'Pembayaran berhasil dikonfirmasi!', proposal: result });
  } catch (error: any) {
    console.error("PAYMENT ERROR:", error);
    return NextResponse.json({ message: error.message || 'Gagal memproses pembayaran' }, { status: 500 });
  }
}
