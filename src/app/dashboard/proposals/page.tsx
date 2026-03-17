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
  details: { nominal: number }[];
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
      'DRAFT': { label: 'Draf', css: 'bg-gray-100 text-gray-600' },
      'PENDING': { label: 'Menunggu', css: 'bg-yellow-100 text-yellow-800' },
      'APPROVED_LV1': { label: 'Disetujui Atasan', css: 'bg-blue-100 text-blue-800' },
      'APPROVED_LV2': { label: 'Review Pusat', css: 'bg-indigo-100 text-indigo-800' },
      'APPROVED_FINAL': { label: 'Siap Bayar', css: 'bg-green-100 text-green-800' },
      'PAID': { label: 'Sudah Terbayar', css: 'bg-emerald-600 text-white' },
      'REJECTED': { label: 'Ditolak', css: 'bg-red-100 text-red-800' },
    };
    const s = map[status] || { label: status, css: 'bg-gray-100 text-gray-800' };
    return <span className={`${s.css} px-2 py-1 rounded text-xs font-semibold border shadow-sm`}>{s.label}</span>;
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
    const weight: any = { 'PENDING': 0, 'APPROVED_LV1': 1, 'APPROVED_LV2': 1, 'APPROVED_FINAL': 2, 'PAID': 3 };
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {loading ? (
             <div className="p-8 text-center text-gray-500">Memuat data usulan...</div>
         ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-600">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                   <tr>
                     <th className="px-6 py-4">ID & Tanggal</th>
                     <th className="px-6 py-4">Judul Program Kerja</th>
                     <th className="px-6 py-4">Total Biaya</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-center">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {proposals.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-4 text-center">Belum ada usulan anggaran yang diajukan.</td></tr>
                   ) : proposals.map(p => {
                     const total = p.details.reduce((sum: number, item: any) => sum + Number(item.nominal), 0);
                     return (
                     <tr key={p.id} className="hover:bg-gray-50 transition border-l-4 border-transparent hover:border-muh-green">
                       <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-[10px] text-gray-400">#USL-{p.id.toString().padStart(4, '0')}</span>
                          <div className="text-gray-900 font-medium mt-1">{new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{p.judul}</div>
                          <div className="text-xs text-muh-green font-medium mt-1">{p.activity_type.nama} · {p.unit.nama_unit}</div>
                       </td>
                       <td className="px-6 py-4 font-bold text-gray-900">
                          Rp {total.toLocaleString('id-ID')}
                       </td>
                       <td className="px-6 py-4 text-center">
                          {getStatusBadge(p.status_terakhir)}
                       </td>
                       <td className="px-6 py-4 text-center">
                            <div className="flex flex-col gap-1 items-center min-w-[120px]">
                              <button 
                                onClick={() => {
                                   fetch(`/api/proposals/${p.id}`).then(r => r.json()).then(d => setSelectedProposal(d));
                                }}
                                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all"
                              >
                                👁 Lihat Detail & Alur
                              </button>
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
                   )})}
                 </tbody>
               </table>
             </div>
         )}
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
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* ALUR PROGRESS (STEPPER) */}
              <div className="mb-10">
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
                <div className="mb-8">
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

              <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-xl">
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Unit Pengaju</p>
                   <p className="font-bold text-gray-800">{selectedProposal.unit?.nama_unit || selectedProposal.unit?.nama || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Pemohon</p>
                   <p className="font-bold text-gray-800">{selectedProposal.pemohon?.nama || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Jenis Kegiatan</p>
                   <p className="font-bold text-gray-800">{selectedProposal.activity_type?.nama || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Total Anggaran</p>
                   <p className="font-bold text-blue-600 text-lg">
                    Rp {(selectedProposal.details?.reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0) || 0).toLocaleString('id-ID')}
                   </p>
                 </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-4">Rincian Komponen Biaya</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                   <table className="w-full text-xs">
                     <thead className="bg-gray-50 font-bold border-b">
                        <tr>
                           <th className="px-4 py-2 text-left">Komponen / Item</th>
                           <th className="px-4 py-2 text-right">Nominal</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {selectedProposal.details?.map((d: any, i: number) => (
                           <tr key={i}>
                              <td className="px-4 py-2 text-gray-600">Item #{i+1}</td>
                              <td className="px-4 py-2 text-right font-mono font-bold">Rp {Number(d.nominal).toLocaleString('id-ID')}</td>
                           </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-end">
               <button onClick={() => setSelectedProposal(null)} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-sm">Tutup Detail</button>
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
