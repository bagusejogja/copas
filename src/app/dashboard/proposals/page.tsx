"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Proposal = {
  id: number;
  judul: string;
  status_terakhir: string;
  tanggal: string;
  unit: { nama_unit: string };
  pemohon: { nama: string };
  activity_type: { nama: string };
  details: { nominal: number; deskripsi?: string }[];
  proker?: { id: number; nama_kegiatan: string } | null;
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  // Filters
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [filterUnit, filterStatus]);

  const fetchUserPermissions = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data);
    if (data && data.permissions) {
      const p = data.permissions.find((perm: any) => perm.menu.path === '/dashboard/proposals');
      setCanCreate(p ? p.can_create : false);
    }
    
    // If Admin or PDM (Unit 1), fetch units for filter
    if (data?.role?.level === 99 || data?.unit?.id === 1) {
      const resUnits = await fetch('/api/units');
      const dataUnits = await resUnits.json();
      setUnits(dataUnits || []);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.set('unit_id', filterUnit);
      if (filterStatus) query.set('status', filterStatus);

      const res = await fetch('/api/proposals?' + query.toString());
      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
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
      if (res.ok) {
        alert("Pembayaran berhasil dikonfirmasi!");
        setPaymentModal(null);
        fetchProposals();
      } else {
        const d = await res.json();
        alert("Gagal: " + d.message);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      'DRAFT': { label: 'Draf', css: 'bg-gray-100 text-gray-500' },
      'PENDING': { label: 'Menunggu Persetujuan Lvl 1', css: 'bg-orange-50 text-orange-600 border-orange-100' },
      'APPROVED_LV1': { label: 'Proses di Pusat', css: 'bg-blue-50 text-blue-600 border-blue-100' },
      'APPROVED_STEP_15': { label: 'Review Keuangan', css: 'bg-purple-50 text-purple-600 border-purple-100' },
      'APPROVED_FINAL': { label: 'Siap Bayar', css: 'bg-green-50 text-green-700 border-green-100' },
      'PAID': { label: 'Sudah Cair', css: 'bg-emerald-600 text-white shadow-sm border-emerald-700' },
      'REJECTED': { label: 'Ditolak', css: 'bg-red-50 text-red-600 border-red-100' },
    };
    const s = map[status] || { label: status, css: 'bg-gray-100 text-gray-800' };
    return <span className={`${s.css} px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border shadow-sm`}>{s.label}</span>;
  };
 
  const printProposal = (p: any) => {
    const total = p.details.reduce((s: number, d: any) => s + Number(d.nominal), 0);
    const win = window.open('', '_blank');
    if (!win) return;
    const fmtTgl = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const tglSekarang = fmtTgl(new Date());

    win.document.write(`<html><head><title>Proposal-USL-${String(p.id).padStart(4,'0')}</title>
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
      <div class="content"><b>Tujuan:</b> ${p.tujuan || '-'}<br/><b>Sasaran:</b> ${p.sasaran || '-'} (Peserta: ${p.jumlah_peserta || 0} orang)</div>
      <div class="section-title">III. SUSUNAN PANITIA</div>
      <div class="content">${p.susunan_panitia || '-'}</div>

      <div class="section-title">IV. KEBUTUHAN PERALATAN/SARANA</div>
      <div class="content">${p.peralatan || '-'}</div>

      <div class="section-title">V. RINCIAN ANGGARAN BIAYA (RAB)</div>
      <table>
        <thead><tr><th>No</th><th>Uraian Komponen Biaya</th><th>Nominal (Rp)</th></tr></thead>
        <tbody>
          ${p.details.map((d:any, i:number) => `<tr><td align="center">${i+1}</td><td>${d.deskripsi}</td><td align="right">${Number(d.nominal).toLocaleString('id-ID')}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="2" align="right">JUMLAH TOTAL</td><td align="right">${total.toLocaleString('id-ID')}</td></tr>
        </tbody>
      </table>
      <div class="signature-wrapper">
        <p style="text-align: right; margin-right: 50px; margin-bottom: 10px;">Yogyakarta, ${tglSekarang}</p>
        <table class="sig-table">
          <tr>
            <td><p>Pemohon/Sekretaris,</p><div class="sig-space"></div><p><b>( ${p.pemohon?.nama} )</b></p></td>
            <td><p>Mengetahui,<br/>Ketua Unit/Majelis</p><div class="sig-space"></div><p><b>( ............................... )</b></p></td>
            <td><p>Menyetujui,<br/>Bendahara / PDMK</p><div class="sig-space"></div><p><b>( ${p.status_terakhir === 'PAID' ? p.dibayar_oleh?.nama : '...............................'} )</b></p></td>
          </tr>
        </table>
      </div>
      <script>window.print();</script>
    </body></html>`);
    win.document.close();
  };

  // Stepper logic
  const steps = [
    { key: 'SUBMITTED', label: 'Pengajuan', icon: '📝' },
    { key: 'APPROVED_LV1', label: 'Atasan', icon: '👤' },
    { key: 'APPROVED_FINAL', label: 'Disetujui', icon: '✅' },
    { key: 'PAID', label: 'Cair / Bayar', icon: '💰' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === 'REJECTED') {
      return 'rejected';
    }
    const weight: any = { 'PENDING': 0, 'APPROVED_LV1': 1, 'APPROVED_STEP_15': 1.5, 'APPROVED_LV2': 1.5, 'APPROVED_FINAL': 2, 'PAID': 3 };
    const stepWeight: any = { 'SUBMITTED': 0, 'APPROVED_LV1': 1, 'APPROVED_FINAL': 2, 'PAID': 3 };
    if (weight[currentStatus] >= stepWeight[stepKey]) return 'completed';
    return 'pending';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center border-b pb-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Daftar Usulan Anggaran</h1>
           <p className="mt-1 text-gray-600 text-sm">Lihat status pengajuan program kerja dari unit Anda.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/proposals/create" className="bg-muh-green hover:bg-muh-green-dark text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Buat Usulan Baru
          </Link>
        )}
      </div>
      
      {/* FILTER PANEL (For PDM / Admin) */}
      {(user?.role?.level === 99 || user?.unit?.id === 1) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter Unit / Majelis</label>
            <select 
              value={filterUnit} 
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full border-gray-200 rounded-lg p-2 text-sm focus:ring-muh-green"
            >
              <option value="">-- Semua Unit --</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nama_unit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border-gray-200 rounded-lg p-2 text-sm focus:ring-muh-green"
            >
              <option value="">-- Semua Status --</option>
              <option value="DRAFT">Draf</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="APPROVED_FINAL">Disetujui (Siap Bayar)</option>
              <option value="APPROVED_STEP_15">Review Keuangan</option>
              <option value="PAID">Sudah Terbayar</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => { setFilterUnit(''); setFilterStatus(''); }}
              className="text-xs text-red-500 font-bold hover:underline mb-2"
            >
              ✕ Reset Filter
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
         {loading ? (
             <div className="bg-white rounded-2xl shadow-sm border p-16 flex items-center justify-center gap-3">
               <div className="w-6 h-6 border-2 border-muh-green/30 border-t-muh-green rounded-full animate-spin"></div>
               <span className="text-gray-500 text-sm">Memuat data usulan...</span>
             </div>
         ) : proposals.length === 0 ? (
             <div className="bg-white rounded-2xl shadow-sm border p-16 text-center">
               <div className="text-5xl mb-4">📭</div>
               <p className="text-gray-700 font-bold text-lg">Belum ada usulan anggaran.</p>
               <p className="text-gray-400 text-sm mt-1 italic">Silakan buat usulan baru untuk memulai.</p>
             </div>
         ) : (() => {
           // Group proposals by proker
           const grouped: Record<string, { prokerName: string; items: Proposal[] }> = {};
           proposals.forEach((p: any) => {
             const key = p.proker?.id ? String(p.proker.id) : '_non_proker';
             if (!grouped[key]) {
               grouped[key] = { prokerName: p.proker?.nama_kegiatan || 'Usulan Non-Proker (Tanpa Program Kerja)', items: [] };
             }
             grouped[key].items.push(p);
           });
           const groupKeys = Object.keys(grouped);

           return groupKeys.map(key => {
             const grp = grouped[key];
             const grpTotal = grp.items.reduce((s, p) => s + p.details.reduce((ss, d) => ss + Number(d.nominal), 0), 0);
             return (
               <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 {/* Group Header */}
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <div>
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Program Kerja</p>
                     <h3 className="font-bold text-gray-800">{grp.prokerName}</h3>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-gray-400 font-bold uppercase">{grp.items.length} Pengajuan · Total:</p>
                     <p className="font-black text-muh-green">Rp {grpTotal.toLocaleString('id-ID')}</p>
                   </div>
                 </div>

                 {/* Proposals Table */}
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left text-gray-600">
                     <thead className="text-[10px] text-gray-400 uppercase bg-gray-50/50 border-b font-black tracking-wider">
                       <tr>
                         <th className="px-5 py-3">ID & Tanggal</th>
                         <th className="px-5 py-3">Judul Usulan</th>
                         <th className="px-5 py-3 text-right">Nominal</th>
                         <th className="px-5 py-3 text-center">Status</th>
                         <th className="px-5 py-3 text-center">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {grp.items.map((p: any) => {
                         const total = p.details.reduce((sum: number, item: any) => sum + Number(item.nominal), 0);
                         return (
                           <tr key={p.id} className="hover:bg-emerald-50/30 transition border-l-4 border-transparent hover:border-muh-green">
                             <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#USL-{p.id.toString().padStart(4, '0')}</span>
                                <div className="text-gray-700 text-xs mt-1">{new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                             </td>
                             <td className="px-5 py-3.5">
                                <p className="font-bold text-gray-800">{p.judul}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{p.activity_type.nama} · {p.unit.nama_unit} · <span className="text-gray-400">{p.pemohon.nama}</span></p>
                             </td>
                             <td className="px-5 py-3.5 text-right font-bold font-mono text-gray-800">
                                Rp {total.toLocaleString('id-ID')}
                             </td>
                             <td className="px-5 py-3.5 text-center">
                                {getStatusBadge(p.status_terakhir)}
                             </td>
                             <td className="px-5 py-3.5 text-center">
                                  <div className="flex flex-col gap-1 items-center min-w-[120px]">
                                    <button 
                                      onClick={() => {
                                         fetch(`/api/proposals/${p.id}`).then(r => r.json()).then(d => setSelectedProposal(d));
                                      }}
                                      className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all"
                                    >
                                      👁 Lihat Detail & Alur
                                    </button>
                                    {p.status_terakhir !== 'DRAFT' && (
                                       <button 
                                          onClick={() => printProposal(p)}
                                          className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all border border-emerald-100"
                                       >
                                          🖨 Cetak PDF
                                       </button>
                                    )}
                                    {(p.status_terakhir === 'REJECTED' || p.status_terakhir === 'DRAFT') && (
                                      <Link 
                                        href={`/dashboard/proposals/edit/${p.id}`}
                                        className="w-full bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all text-center"
                                      >
                                        {p.status_terakhir === 'DRAFT' ? 'Lanjutkan Draft' : '✎ Revisi & Ajukan'}
                                      </Link>
                                    )}
                                  </div>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             );
           });
         })()}
      </div>

      {/* MODAL DETAIL */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedProposal.judul || 'Tanpa Judul'}</h2>
                <p className="text-xs text-gray-500 mt-1">ID Pengajuan: #USL-{selectedProposal.id?.toString().padStart(4, '0') || '0000'}</p>
              </div>
              <button onClick={() => setSelectedProposal(null)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-8">
              {/* ALUR PROGRESS (STEPPER) */}
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-6">Status Alur Persetujuan</p>
                <div className="flex items-center justify-between relative px-4">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                  {steps.map((step, idx) => {
                     const status = getStepStatus(step.key, selectedProposal.status_terakhir);
                     const isDone = status === 'completed';
                     const isFail = status === 'rejected';
                     return (
                       <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all ${isDone ? 'bg-muh-green text-white scale-110' : isFail ? 'bg-red-500 text-white scale-110' : 'bg-white border-2 border-gray-100'}`}>
                            {isDone ? '✓' : isFail ? '✗' : step.icon}
                          </div>
                          <span className={`text-[10px] font-bold ${isDone ? 'text-muh-green' : isFail ? 'text-red-500' : 'text-gray-400'}`}>{step.label}</span>
                       </div>
                     )
                  })}
                </div>
                {selectedProposal.status_terakhir === 'REJECTED' && (
                  <div className="mt-6 bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-xs text-red-800 font-bold">⚠️ Usulan Ditolak / Perlu Revisi</p>
                    <p className="text-[10px] text-red-600 mt-1">Silakan klik tombol "Revisi" di daftar usulan untuk memperbaiki dan mengirim ulang.</p>
                  </div>
                )}
              </div>

              {/* RIWAYAT / HISTORY */}
              {selectedProposal.approvals && selectedProposal.approvals.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Log Persetujuan (Riwayat)</p>
                  <div className="space-y-3 border-l-2 border-dashed border-gray-200 ml-4 pl-6">
                    {selectedProposal.approvals.map((a: any) => (
                      <div key={a.id} className="relative">
                        <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 bg-white ${a.status === 'APPROVE' ? 'border-green-500' : 'border-red-500'}`}></div>
                        <p className="text-xs font-bold text-gray-800">{a.status === 'APPROVE' ? 'Disetujui' : 'Ditolak'} - {a.approver?.role?.nama_jabatan || 'Approver'}</p>
                        <p className="text-[10px] text-gray-500">Oleh <span className="text-gray-900 font-semibold">{a.approver?.nama}</span> pada {new Date(a.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        {a.catatan && <p className="text-[10px] bg-white border italic p-2 rounded mt-1 text-gray-600">"{a.catatan}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INFO CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Unit</p>
                   <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedProposal.unit?.nama_unit || '-'}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Pemohon</p>
                   <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedProposal.pemohon?.nama || '-'}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Jenis Kegiatan</p>
                   <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedProposal.activity_type?.nama || '-'}</p>
                 </div>
                 <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                   <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Total Anggaran</p>
                   <p className="font-black text-blue-700 text-lg mt-0.5">
                    Rp {(selectedProposal.details?.reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0) || 0).toLocaleString('id-ID')}
                   </p>
                 </div>
              </div>

              {/* PROKER INFO */}
              {selectedProposal.proker && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Terkait Program Kerja</p>
                  <p className="font-bold text-emerald-800 mt-0.5">{selectedProposal.proker?.nama_kegiatan}</p>
                </div>
              )}

              {/* NARASI (if available) */}
              {(selectedProposal.latar_belakang || selectedProposal.tujuan || selectedProposal.bentuk_kegiatan) && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Narasi Proposal</p>
                  {selectedProposal.latar_belakang && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Latar Belakang</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{selectedProposal.latar_belakang}</p>
                    </div>
                  )}
                  {selectedProposal.tujuan && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Tujuan Kegiatan</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{selectedProposal.tujuan}</p>
                    </div>
                  )}
                  {selectedProposal.bentuk_kegiatan && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Bentuk Kegiatan</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{selectedProposal.bentuk_kegiatan}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TIME & LOCATION */}
              {(selectedProposal.tanggal_mulai || selectedProposal.tempat) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedProposal.tanggal_mulai && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Waktu Pelaksanaan</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">
                        {new Date(selectedProposal.tanggal_mulai).toLocaleDateString('id-ID')}
                        {selectedProposal.tanggal_selesai && ` s/d ${new Date(selectedProposal.tanggal_selesai).toLocaleDateString('id-ID')}`}
                      </p>
                    </div>
                  )}
                  {selectedProposal.tempat && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Tempat Kegiatan</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedProposal.tempat}</p>
                    </div>
                  )}
                </div>
              )}

              {/* RINCIAN BIAYA */}
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Rincian Komponen Biaya</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                   <table className="w-full text-xs">
                     <thead className="bg-gray-50 font-bold border-b text-gray-500 text-[10px] uppercase">
                        <tr>
                           <th className="px-4 py-2.5 text-left w-8">No</th>
                           <th className="px-4 py-2.5 text-left">Komponen / Item</th>
                           <th className="px-4 py-2.5 text-right">Nominal</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {selectedProposal.details?.map((d: any, i: number) => (
                           <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 text-gray-400 font-mono">{i+1}</td>
                              <td className="px-4 py-2.5 text-gray-700 font-medium">{d.deskripsi || `Item Komponen #${i+1}`}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-800">Rp {Number(d.nominal).toLocaleString('id-ID')}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="bg-blue-900 text-white">
                        <tr>
                           <td colSpan={2} className="px-4 py-2.5 text-right text-[10px] uppercase font-bold tracking-widest opacity-80">Total</td>
                           <td className="px-4 py-2.5 text-right font-mono font-black">
                             Rp {(selectedProposal.details?.reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0) || 0).toLocaleString('id-ID')}
                           </td>
                        </tr>
                     </tfoot>
                   </table>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
               {selectedProposal.status_terakhir === 'APPROVED_FINAL' && (
                 <button onClick={() => { setSelectedProposal(null); setPaymentModal(selectedProposal); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-700 transition-all">💵 Bayarkan</button>
               )}
               <button onClick={() => setSelectedProposal(null)} className="bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL BAYAR (BENDAHARA) */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden stagger-fade-in">
            <form onSubmit={handlePay}>
              <div className="p-6 border-b bg-emerald-50">
                <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2">
                   <span className="text-2xl">💵</span> Konfirmasi Pembayaran
                </h3>
                <p className="text-xs text-emerald-700 font-medium mt-1">Lakukan pembayaran untuk usulan ID #USL-{paymentModal.id}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Nominal yang Dibayarkan</p>
                   <p className="text-2xl font-black text-gray-900">
                     Rp {paymentModal.details?.reduce((s:number, d:any) => s + Number(d.nominal), 0).toLocaleString('id-ID')}
                   </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Bayar (Sesuai Kas)</label>
                  <input required name="tanggal_bayar" type="date" className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-emerald-500" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan / Keterangan Kas</label>
                  <textarea name="deskripsi" className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-emerald-500" placeholder="Misal: Pembayaran via Transfer Bank Jateng..." rows={2}></textarea>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-200 transition">Batal</button>
                <button 
                  type="submit" 
                  disabled={isPaying}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : '✓ Konfirmasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
