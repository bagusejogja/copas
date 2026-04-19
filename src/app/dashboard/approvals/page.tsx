"use client";
import { useState, useEffect } from 'react';

type ApprovalModal = { show: boolean; id: number | null; action: 'APPROVE' | 'REJECT' | null };
type ViewModal = { show: boolean; proposal: any | null };

export default function ApprovalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [modal, setModal] = useState<ApprovalModal>({ show: false, id: null, action: null });
  const [viewModal, setViewModal] = useState<ViewModal>({ show: false, proposal: null });
  const [catatan, setCatatan] = useState('');
  const [nominalRevisi, setNominalRevisi] = useState<Record<number, string>>({});
  const [user, setUser] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => { 
    fetchApprovals(); 
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data);
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const openApproveModal = (p: any, action: 'APPROVE' | 'REJECT') => {
    setCatatan('');
    if (action === 'APPROVE') {
      const pre: Record<number, string> = {};
      p.details.forEach((d: any) => { pre[d.id] = String(d.nominal); });
      setNominalRevisi(pre);
    }
    setModal({ show: true, id: p.id, action });
  };

  const handleConfirm = async () => {
    if (!modal.id || !modal.action) return;
    const id = modal.id;
    const action = modal.action;
    if (action === 'REJECT' && !catatan.trim()) { alert('Alasan penolakan wajib diisi!'); return; }
    const proposal = proposals.find((p: any) => p.id === id);
    let adjustedDetails = undefined;
    if (action === 'APPROVE' && proposal) {
      adjustedDetails = proposal.details.map((d: any) => ({
        id: d.id, nominal: nominalRevisi[d.id] !== undefined ? Number(nominalRevisi[d.id]) : Number(d.nominal)
      }));
    }
    setProcessingId(id);
    setModal({ show: false, id: null, action: null });
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: id, action, catatan, adjustedDetails })
      });
      if (res.ok) { fetchApprovals(); }
      else { const err = await res.json(); alert('Gagal: ' + err.message); }
    } finally { setProcessingId(null); }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      tanggal_bayar: formData.get('tanggal_bayar'),
      deskripsi: formData.get('deskripsi')
    };
    setIsPaying(true);
    try {
      const res = await fetch(`/api/proposals/${paymentModal.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) { alert("Pembayaran berhasil dikonfirmasi!"); setPaymentModal(null); fetchApprovals(); }
      else { const d = await res.json(); alert("Gagal: " + d.message); }
    } finally { setIsPaying(false); }
  };

  const printProposal = (p: any) => {
    const total = p.details.reduce((s: number, d: any) => s + Number(d.nominal), 0);
    const win = window.open('', '_blank');
    if (!win) return;
    
    // Format tanggal
    const fmtTgl = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const tglSekarang = fmtTgl(new Date());

    win.document.write(`<html><head>
    <title>Proposal-USL-${String(p.id).padStart(4,'0')}</title>
    <style>
      @page { size: A4; margin: 1.5cm; }
      body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.4; font-size: 12px; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
      .kop { font-size: 16px; font-weight: bold; margin: 0; }
      .subkop { font-size: 12px; margin: 2px 0; }
      .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
      
      .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
      .content { margin-left: 20px; text-align: justify; margin-bottom: 10px; }
      .content ul, .content ol { margin-left: 20px; padding-left: 15px; }
      .content li { margin-bottom: 3px; }
      .content strong, .content b { font-weight: bold; }
      .content em, .content i { font-style: italic; }
      .content u { text-decoration: underline; }
      
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; }
      th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      .total-row { font-weight: bold; background-color: #f9f9f9; }
      
      .signature-wrapper { margin-top: 40px; width: 100%; }
      .sig-table { width: 100%; border: none !important; }
      .sig-table td { border: none !important; text-align: center; width: 33%; padding: 0; }
      .sig-space { height: 70px; }
      
      .meta-table { width: 100%; border: none !important; margin-bottom: 20px; }
      .meta-table td { border: none !important; padding: 2px 0; vertical-align: top; }
      .meta-label { font-weight: bold; width: 140px; }
      .meta-colon { width: 15px; }
    </style>
    </head><body>
      <div class="header">
        <p class="kop">PIMPINAN DAERAH MUHAMMADIYAH KOTA YOGYAKARTA</p>
        <p class="subkop">Jl. Sultan Agung No.14, Gunungketur, Pakualaman, Kota Yogyakarta</p>
      </div>
      
      <div class="title">FORMULIR PENGAJUAN USULAN ANGGARAN</div>
      
      <table class="meta-table">
        <tr><td class="meta-label">ID Usulan</td><td class="meta-colon">:</td><td>#USL-${String(p.id).padStart(4,'0')}</td></tr>
        <tr><td class="meta-label">Program Kerja</td><td class="meta-colon">:</td><td>${p.proker?.nama_kegiatan || '-'}</td></tr>
        <tr><td class="meta-label">Judul Usulan</td><td class="meta-colon">:</td><td style="font-weight:bold">${p.judul}</td></tr>
        <tr><td class="meta-label">Unit / Majelis</td><td class="meta-colon">:</td><td>${p.unit?.nama_unit}</td></tr>
        <tr><td class="meta-label">Jenis Kegiatan</td><td class="meta-colon">:</td><td>${p.activity_type?.nama}</td></tr>
        <tr><td class="meta-label">Tanggal Pengajuan</td><td class="meta-colon">:</td><td>${fmtTgl(p.tanggal)}</td></tr>
        <tr><td class="meta-label">Waktu Pelaksanaan</td><td class="meta-colon">:</td><td>${fmtTgl(p.tanggal_mulai)} ${p.tanggal_selesai ? 's/d ' + fmtTgl(p.tanggal_selesai) : ''}</td></tr>
        <tr><td class="meta-label">Tempat</td><td class="meta-colon">:</td><td>${p.tempat || '-'}</td></tr>
      </table>

      <div class="section-title">I. LATAR BELAKANG</div>
      <div class="content">${p.latar_belakang || 'Terlampir dalam TOR kegiatan.'}</div>

      <div class="section-title">II. TUJUAN & SASARAN</div>
      <div class="content">
        <b>Tujuan:</b> ${p.tujuan || '-'}<br/>
        <b>Sasaran:</b> ${p.sasaran || '-'} (Peserta: ${p.jumlah_peserta || 0} orang)
      </div>

      <div class="section-title">III. SUSUNAN PANITIA</div>
      <div class="content">${p.susunan_panitia || '-'}</div>

      <div class="section-title">IV. KEBUTUHAN PERALATAN/SARANA</div>
      <div class="content">${p.peralatan || '-'}</div>

      <div class="section-title">V. RINCIAN ANGGARAN BIAYA (RAB)</div>
      <table>
        <thead>
          <tr>
            <th width="30">No</th>
            <th>Uraian Komponen Biaya</th>
            <th width="120">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${p.details.map((d:any, i:number) => `
            <tr>
              <td align="center">${i+1}</td>
              <td>${d.deskripsi}</td>
              <td align="right">${Number(d.nominal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2" align="right">JUMLAH TOTAL</td>
            <td align="right">${total.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>

      <div class="signature-wrapper">
        <p style="text-align: right; margin-right: 50px; margin-bottom: 10px;">Yogyakarta, ${tglSekarang}</p>
        <table class="sig-table">
          <tr>
            <td>
              <p>Pemohon/Sekretaris,</p>
              <div class="sig-space"></div>
              <p><b>( ${p.pemohon?.nama} )</b></p>
            </td>
            <td>
              <p>Mengetahui,<br/>Ketua Unit/Majelis</p>
              <div class="sig-space"></div>
              <p><b>( ............................... )</b></p>
            </td>
            <td>
              <p>Menyetujui,<br/>Bendahara / PDMK</p>
              <div class="sig-space"></div>
              <p><b>( ${p.status_terakhir === 'PAID' ? p.dibayar_oleh?.nama : '...............................'} )</b></p>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; font-size: 10px; color: #666; font-style: italic; border-top: 1px dashed #ccc; padding-top: 5px;">
        * Dokumen ini dicetak otomatis secara digital melalui Sistem Informasi Keuangan PDM Kota Yogyakarta.
      </div>

      <script>window.print();</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Persetujuan Usulan (Approval)</h1>
        <p className="mt-1 text-gray-600 text-sm">Tinjau dan putuskan usulan anggaran yang membutuhkan persetujuan Anda.</p>
      </div>

      {/* ===== MODAL VIEW DETAIL ===== */}
      {viewModal.show && viewModal.proposal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muh-green-dark text-white rounded-t-2xl">
              <div>
                <p className="text-xs text-green-200 font-mono">#USL-{String(viewModal.proposal.id).padStart(4,'0')}</p>
                <h2 className="text-lg font-bold">{viewModal.proposal.judul}</h2>
              </div>
              <button onClick={() => setViewModal({show:false,proposal:null})} className="text-white/80 hover:text-white text-2xl font-bold">✕</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                {[
                  ['Jenis Kegiatan', viewModal.proposal.activity_type?.nama],
                  ['Unit / Majelis', viewModal.proposal.unit?.nama_unit],
                  ['Pemohon', viewModal.proposal.pemohon?.nama],
                  ['Tanggal Pengajuan', new Date(viewModal.proposal.tanggal).toLocaleDateString('id-ID')],
                  ['Waktu Pelaksanaan', viewModal.proposal.waktu_pelaksanaan ? new Date(viewModal.proposal.waktu_pelaksanaan).toLocaleDateString('id-ID') : '-'],
                  ['Jumlah Peserta', viewModal.proposal.jumlah_peserta ? `${viewModal.proposal.jumlah_peserta} orang` : '-'],
                  ['Bentuk Kegiatan', viewModal.proposal.bentuk_kegiatan || '-'],
                  ['Kerjasama', viewModal.proposal.kerjasama || '-'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{val || '-'}</p>
                  </div>
                ))}
              </div>
              {viewModal.proposal.latar_belakang && (
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Latar Belakang</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg">{viewModal.proposal.latar_belakang}</p></div>
              )}
              {viewModal.proposal.tujuan && (
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Tujuan Kegiatan</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg">{viewModal.proposal.tujuan}</p></div>
              )}

              {/* Alur Persetujuan / Timeline */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Alur Persetujuan</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs">📄</span>
                    </div>
                    <div className="flex-1 pb-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">Pengajuan Dibuat</p>
                      <p className="text-xs text-gray-500">oleh {viewModal.proposal.pemohon?.nama} · {new Date(viewModal.proposal.tanggal).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  {viewModal.proposal.approvals?.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs ${a.status === 'APPROVE' ? 'bg-green-100 border-green-400 text-green-600' : 'bg-red-100 border-red-400 text-red-600'}`}>
                        {a.status === 'APPROVE' ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{a.status === 'APPROVE' ? 'Disetujui' : 'Ditolak'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.status === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Level {a.level_approval}</span>
                        </div>
                        <p className="text-xs text-gray-500">oleh <span className="font-semibold">{a.approver?.nama}</span> ({a.approver?.role?.nama_jabatan}) · {new Date(a.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        {a.catatan && <p className="text-xs text-gray-600 mt-1 italic bg-gray-50 px-2 py-1 rounded">"{a.catatan}"</p>}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs ${viewModal.proposal.status_terakhir === 'APPROVED_FINAL' ? 'bg-green-200 border-green-500' : viewModal.proposal.status_terakhir === 'REJECTED' ? 'bg-red-200 border-red-500' : 'bg-yellow-100 border-yellow-400'}`}>
                      {viewModal.proposal.status_terakhir === 'APPROVED_FINAL' ? '✅' : viewModal.proposal.status_terakhir === 'REJECTED' ? '✗' : '⏳'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {viewModal.proposal.status_terakhir === 'APPROVED_FINAL' ? 'Final — Anggaran Siap Cair'
                          : viewModal.proposal.status_terakhir === 'REJECTED' ? 'Ditolak'
                          : 'Menunggu Persetujuan Berikutnya'}
                      </p>
                      <p className="text-xs text-gray-500">{viewModal.proposal.status_terakhir}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RAB Table */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Rincian Anggaran Biaya (RAB)</p>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                    <tr><th className="px-4 py-3 text-left">No</th><th className="px-4 py-3 text-left">Deskripsi</th><th className="px-4 py-3 text-right">Nominal (Rp)</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewModal.proposal.details.map((d: any, i: number) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{i+1}</td>
                        <td className="px-4 py-2">{d.deskripsi}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">Rp {Number(d.nominal).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="bg-muh-green/5 font-bold">
                      <td colSpan={2} className="px-4 py-3 text-right text-sm">TOTAL</td>
                      <td className="px-4 py-3 text-right font-mono text-base text-muh-green">
                        Rp {viewModal.proposal.details.reduce((s: number, d: any) => s + Number(d.nominal), 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => printProposal(viewModal.proposal)} 
                className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-2"
              >
                🖨 PDF
              </button>
              <button 
                onClick={() => { setViewModal({show:false, proposal:null}); openApproveModal(viewModal.proposal, 'REJECT'); }} 
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
              >
                ✗ Tolak
              </button>
              <button 
                onClick={() => { setViewModal({show:false, proposal:null}); openApproveModal(viewModal.proposal, 'APPROVE'); }} 
                className="bg-muh-green text-white px-6 py-2 rounded-lg font-bold hover:bg-muh-green-dark shadow-md"
              >
                ✓ Setuju & Proses
              </button>
              <button 
                onClick={() => setViewModal({show:false,proposal:null})} 
                className="bg-white text-gray-500 border px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL APPROVAL ===== */}
      {modal.show && modal.id && (() => {
        const p = proposals.find((x: any) => x.id === modal.id);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className={`px-6 py-4 rounded-t-2xl text-white ${modal.action === 'APPROVE' ? 'bg-green-600' : 'bg-red-600'}`}>
                <h2 className="text-xl font-bold">{modal.action === 'APPROVE' ? '✓ Konfirmasi Persetujuan' : '✗ Konfirmasi Penolakan'}</h2>
                <p className="text-sm text-white/80 mt-0.5">{p?.judul}</p>
              </div>
              <div className="p-6 space-y-5">
                {modal.action === 'APPROVE' && p && (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Rincian Nominal — ubah kolom "Revisi" jika perlu:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 text-gray-600 uppercase">
                          <tr><th className="px-4 py-3 text-left">Deskripsi</th><th className="px-4 py-3 text-right">Nominal Diajukan (Rp)</th><th className="px-4 py-3 text-right min-w-[150px]">Nominal Revisi (Rp)</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {p.details.map((d: any) => (
                            <tr key={d.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{d.deskripsi}</td>
                              <td className="px-4 py-2 text-right font-mono text-gray-500 line-through">{Number(d.nominal).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2">
                                <input type="number" value={nominalRevisi[d.id] ?? d.nominal}
                                  onChange={e => setNominalRevisi(prev => ({ ...prev, [d.id]: e.target.value }))}
                                  className="w-full border border-blue-300 rounded p-1.5 text-right font-mono text-sm bg-blue-50" />
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold text-sm">
                            <td className="px-4 py-2 text-right" colSpan={2}>Total Revisi:</td>
                            <td className="px-4 py-2 text-right font-mono text-muh-green">
                              Rp {Object.values(nominalRevisi).reduce((s, v) => s + (Number(v)||0), 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Catatan {modal.action === 'REJECT' ? <span className="text-red-500">*</span> : '(Opsional)'}
                  </label>
                  <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder={modal.action === 'REJECT' ? 'Alasan penolakan wajib diisi...' : 'Catatan persetujuan...'} />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex gap-3 justify-end">
                <button onClick={() => setModal({show:false,id:null,action:null})} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Batal</button>
                <button onClick={handleConfirm}
                  className={`px-7 py-2 rounded-lg font-bold text-white ${modal.action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {modal.action === 'APPROVE' ? '✓ Setujui' : '✗ Tolak Usulan'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== MAIN TABLE ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="bg-green-50 rounded-full p-5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Antrean Bersih!</h3>
            <p className="text-gray-500 text-sm mt-1">Tidak ada usulan yang menunggu persetujuan Anda saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-4">No Usulan & Judul</th>
                  <th className="px-5 py-4">Pemohon & Unit</th>
                  <th className="px-5 py-4 text-right">Total Anggaran</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proposals.map((p: any) => {
                  const total = p.details.reduce((s: number, d: any) => s + Number(d.nominal), 0);
                  const isProcessing = processingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-400">#USL-{String(p.id).padStart(4,'0')}</span>
                        <div className="font-bold text-gray-900 mt-1">{p.judul}</div>
                        <div className="text-xs text-muh-green mt-0.5">{p.activity_type.nama}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-800">{p.pemohon.nama}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.unit.nama_unit}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="font-extrabold text-gray-900">Rp {total.toLocaleString('id-ID')}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.details.length} baris RAB</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {(() => {
                             const map: any = {
                               'DRAFT': { label: 'Draf', css: 'bg-gray-100 text-gray-500' },
                               'PENDING': { label: 'Menunggu Persetujuan Lvl 1', css: 'bg-orange-50 text-orange-600 border-orange-100' },
                               'APPROVED_LV1': { label: 'Proses di Pusat', css: 'bg-blue-50 text-blue-600 border-blue-100' },
                               'APPROVED_STEP_15': { label: 'Review Keuangan', css: 'bg-purple-50 text-purple-600 border-purple-100' },
                               'APPROVED_FINAL': { label: 'Siap Bayar', css: 'bg-green-50 text-green-700 border-green-100' },
                               'PAID': { label: 'Sudah Cair', css: 'bg-emerald-600 text-white shadow-sm border-emerald-700' },
                               'REJECTED': { label: 'Ditolak', css: 'bg-red-50 text-red-600 border-red-100' },
                             };
                             const s = map[p.status_terakhir] || { label: p.status_terakhir, css: 'bg-gray-100 text-gray-800' };
                           return <span className={`${s.css} px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border shadow-sm`}>{s.label}</span>;
                        })()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setViewModal({show:true, proposal:p})}
                            className="bg-muh-green/10 text-muh-green border border-muh-green/30 px-5 py-2 rounded-lg font-bold hover:bg-muh-green hover:text-white transition-all shadow-sm text-xs"
                          >
                            👁 Periksa Detail
                          </button>
                          {p.status_terakhir === 'APPROVED_FINAL' && (user?.role?.id === 5 || user?.role?.level === 99) && (
                            <button 
                              onClick={() => setPaymentModal(p)}
                              className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-black hover:bg-emerald-700 transition-all shadow-md text-xs animate-pulse"
                            >
                              💵 Bayar Sekarang
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BAYAR (BENDAHARA) */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden stagger-fade-in">
            <form onSubmit={handlePay}>
              <div className="p-6 border-b bg-emerald-50 text-emerald-900">
                <h3 className="text-xl font-black flex items-center gap-2">
                   <span className="text-2xl">💵</span> Konfirmasi Pembayaran
                </h3>
                <p className="text-xs font-medium mt-1 uppercase tracking-wider opacity-70">ID Usulan: #USL-{paymentModal.id}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                   <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Nominal Cair</p>
                   <p className="text-3xl font-black text-gray-900">
                     Rp {paymentModal.details?.reduce((s:number, d:any) => s + Number(d.nominal), 0).toLocaleString('id-ID')}
                   </p>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tanggal Keluar Kas</label>
                   <input required name="tanggal_bayar" type="date" className="w-full border-gray-100 rounded-xl p-3 text-sm focus:ring-emerald-500 bg-gray-50 font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Keterangan / Memo Pembayaran</label>
                   <textarea name="deskripsi" className="w-full border-gray-100 rounded-xl p-3 text-sm focus:ring-emerald-500 bg-gray-50" placeholder="Contoh: Transfer via Bank Mandiri ke Rekening Panitia..." rows={2}></textarea>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-200 transition">Batal</button>
                <button 
                  type="submit" 
                  disabled={isPaying}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isPaying ? 'Memproses...' : '✓ Konfirmasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
