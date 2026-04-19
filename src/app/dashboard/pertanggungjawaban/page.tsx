"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LaporanPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filters
  const [filterUnit, setFilterUnit] = useState('');

  // LPJ Form State
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedLpjId, setSelectedLpjId] = useState<number | null>(null);
  const [ringkasan, setRingkasan] = useState('');
  const [details, setDetails] = useState([{ account_id: '', keterangan: '', nominal: '' }]);
  const [namaPembuat, setNamaPembuat] = useState('');
  const [namaBendahara, setNamaBendahara] = useState('');
  const [namaPimpinan, setNamaPimpinan] = useState('');
  const [opsiSisa, setOpsiSisa] = useState<'KEMBALI' | 'LANJUT'>('KEMBALI');
  const [submitting, setSubmitting] = useState(false);

  // View Modal
  const [viewLpj, setViewLpj] = useState<any | null>(null);
  const [viewRekapProposal, setViewRekapProposal] = useState<any | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.set('unit_id', filterUnit);

      const [resReq, resRef, resUser] = await Promise.all([
        fetch('/api/pertanggungjawaban?' + query.toString()),
        fetch('/api/proposals/references'),
        fetch('/api/auth/me')
      ]);
      const dataReq = await resReq.json();
      const dataRef = await resRef.json();
      const dataUser = await resUser.json();

      if (Array.isArray(dataReq)) setProposals(dataReq);
      setAccounts(dataRef.accounts || []);
      setUser(dataUser);
      
      // If Admin or PDM (Unit 1), fetch units for filter
      if (dataUser?.role?.level === 99 || dataUser?.unit?.id === 1) {
        const resUnits = await fetch('/api/units');
        const dataUnits = await resUnits.json();
        setUnits(dataUnits || []);
      }

      // Check permission for "Pertanggungjawaban" menu
      const p = dataUser.permissions?.find((perm: any) => perm.menu.path === '/dashboard/pertanggungjawaban');
      setCanCreate(p ? p.can_create : false);
      
      // Default Names
      setNamaPembuat(dataUser.nama || '');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchInitialData(); }, [filterUnit]);

  const handleAddRow = () => setDetails([...details, { account_id: '', keterangan: '', nominal: '' }]);
  const handleRemoveRow = (idx: number) => setDetails(details.filter((_, i) => i !== idx));
  const updateDetail = (idx: number, field: string, value: string) => {
    const next = [...details];
    (next[idx] as any)[field] = value;
    setDetails(next);
  };

  const calculateTotalRealisasi = () => details.reduce((s, d) => s + Number(d.nominal || 0), 0);

  const onSelectProposal = (p: any, lpj?: any) => {
    setSelected(p);
    if (lpj) {
      // Editing existing (Draft or Rejected)
      setSelectedLpjId(lpj.id);
      setRingkasan(lpj.ringkasan || '');
      setNamaPembuat(lpj.nama_pembuat || user?.nama || '');
      setNamaBendahara(lpj.nama_bendahara || '');
      setNamaPimpinan(lpj.nama_pimpinan || '');
      setOpsiSisa(lpj.opsi_sisa || 'KEMBALI');
      
      if (lpj.details?.length > 0) {
        setDetails(lpj.details.map((d: any) => ({
          account_id: d.account_id.toString(),
          keterangan: d.keterangan || '',
          nominal: d.nominal.toString()
        })));
      } else {
        setDetails([{ account_id: '', keterangan: '', nominal: '' }]);
      }
    } else {
      // New SPJ for this proposal
      setSelectedLpjId(null);
      setRingkasan('');
      setDetails([{ account_id: '', keterangan: '', nominal: '' }]);
      setNamaPembuat(user?.nama || '');
      setNamaBendahara('');
      setNamaPimpinan('');
      setOpsiSisa('KEMBALI');
    }
  };

  const onSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!selected) return;
    
    // Validation: Cumulative Realization across ALL SPJs cannot exceed Approved Proposal Amount
    const totalRAB = selected.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;
    const others = (selected.pertanggungjawabans || []).filter((pj: any) => pj.id !== selectedLpjId && pj.status !== 'REJECTED');
    const cumRealPrev = others.reduce((s: number, pj: any) => s + Number(pj.total_realisasi), 0);
    const totalNow = cumRealPrev + calculateTotalRealisasi();

    if (totalNow > totalRAB) {
       alert(`Maaf, total realisasi kumulatif (Rp ${totalNow.toLocaleString('id-ID')}) tidak boleh melebihi anggaran yang disetujui (Rp ${totalRAB.toLocaleString('id-ID')}).`);
       return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pertanggungjawaban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lpj_id: selectedLpjId,
          proposal_id: selected.id, 
          ringkasan, 
          total_realisasi: calculateTotalRealisasi(),
          status,
          nama_pembuat: namaPembuat,
          nama_bendahara: namaBendahara,
          nama_pimpinan: namaPimpinan,
          opsi_sisa: opsiSisa,
          details
        })
      });
      if (res.ok) {
        alert(status === 'DRAFT' ? "Draft berhasil disimpan!" : "SPJ berhasil dikirim!");
        setSelected(null);
        fetchInitialData();
      } else {
        const err = await res.json(); alert(err.message);
      }
    } finally { setSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      'PAID': { label: 'Sudah Cair', css: 'bg-emerald-600 text-white shadow-sm' },
      'APPROVED_FINAL': { label: 'Disetujui', css: 'bg-green-100 text-green-800' },
      'APPROVED_LV1': { label: 'Disetujui Atasan', css: 'bg-blue-100 text-blue-800' },
      'APPROVED_STEP_15': { label: 'Review Keuangan', css: 'bg-purple-100 text-purple-800' },
    };
    const s = map[status] || { label: status, css: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${s.css}`}>{s.label}</span>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">E-SPJ</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Laporan Pertanggungjawaban Anggaran & Nota Realisasi</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sistem Akuntabilitas</p>
           <p className="text-xs font-bold text-muh-green">LPJ per Item Nota / Kwitansi</p>
        </div>
      </div>
      
      {/* FILTER PANEL (For PDM / Admin) */}
      {(user?.role?.level === 99 || user?.unit?.id === 1) && (
        <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter Unit / Majelis</label>
              <select 
                value={filterUnit} 
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full border-gray-100 rounded-xl p-2.5 text-xs focus:ring-muh-green font-bold"
              >
                <option value="">-- Semua Unit --</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.nama_unit}</option>
                ))}
              </select>
           </div>
           {filterUnit && (
             <button 
               onClick={() => setFilterUnit('')}
               className="mt-5 text-xs text-red-500 font-bold hover:underline"
             >
               ✕ Reset
             </button>
           )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-20">
           <div className="w-10 h-10 border-4 border-muh-green/20 border-t-muh-green rounded-full animate-spin"></div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm">
           <div className="text-5xl mb-4">📭</div>
           <h3 className="text-xl font-bold text-gray-800">Tidak Ada Usulan Siap SPJ</h3>
           <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">SPJ hanya muncul untuk usulan yang sudah disetujui final atau sudah dibayar bendahara.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           {proposals.map(p => {
            const isSelected = selected?.id === p.id;
            const totalRAB = p.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;
            const lpjs = p.pertanggungjawabans || [];
            
            // Calculate Total Realization (Exclude rejected)
            const cumRealization = lpjs.filter((l: any) => l.status !== 'REJECTED').reduce((s: number, l: any) => s + Number(l.total_realisasi), 0);
            const balance = totalRAB - cumRealization;

            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-400 ring-4 ring-blue-50' : lpjs.length > 0 ? 'border-emerald-100' : 'border-gray-100'}`}>
                 <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded font-mono">#USL-{p.id}</span>
                          {getStatusBadge(p.status_terakhir)}
                          {lpjs.length > 0 && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">{lpjs.length} Nota Terbit</span>}
                       </div>
                       <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">{p.judul}</h2>
                       <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                           <div className="text-xs col-span-2 sm:col-span-1">
                              <p className="text-gray-400 font-bold uppercase text-[9px]">🏢 Unit / Proker</p>
                              <p className="font-semibold text-gray-700">{p.unit?.nama_unit}</p>
                              <p className="font-medium text-gray-500 text-[10px] truncate">{p.proker?.nama_kegiatan || 'Non-Proker'}</p>
                           </div>
                          <div className="text-xs">
                             <p className="text-gray-400 font-bold uppercase text-[9px]">💰 Anggaran Cair</p>
                             <p className="font-semibold text-gray-700">Rp {totalRAB.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-xs">
                             <p className="text-emerald-500 font-bold uppercase text-[9px]">✅ Realisasi (Total)</p>
                             <p className="font-extrabold text-emerald-700">Rp {cumRealization.toLocaleString('id-ID')}</p>
                          </div>
                          <div className={`text-xs p-2 rounded-xl ${balance > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                             <p className="text-gray-500 font-bold uppercase text-[9px]">📉 Sisa Anggaran</p>
                             <p className={`font-black ${balance > 0 ? 'text-orange-600' : 'text-gray-400'}`}>Rp {balance.toLocaleString('id-ID')}</p>
                          </div>
                       </div>

                       {/* List SPJ existing */}
                       {lpjs.length > 0 && (
                         <div className="mt-4 border-t border-gray-100 pt-3">
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Nota SPJ ({lpjs.length}):</p>
                                <button onClick={() => setViewRekapProposal(p)} className="text-[10px] font-black bg-purple-50 text-purple-700 px-3 py-1 rounded-lg border border-purple-100 hover:bg-purple-600 hover:text-white transition-all uppercase tracking-widest">
                                   📑 Lihat Rekap SPJ Usulan
                                </button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {lpjs.map((lpj: any) => {
                                  const sMap: any = {
                                    'DRAFT': { label: 'DRAF', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                                    'SUBMITTED': { label: 'REVIEW', color: 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' },
                                    'REJECTED': { label: 'PERBAIKI', color: 'bg-red-50 text-red-600 border-red-200' },
                                    'APPROVED_FINAL': { label: 'SELESAI', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                                  };
                                  const style = sMap[lpj.status] || { label: lpj.status, color: 'bg-gray-50 text-gray-500' };

                                  return (
                                    <div key={lpj.id} className={`flex items-center gap-2 border px-2.5 py-1.5 rounded-xl transition-all hover:shadow-md ${style.color}`}>
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-1.5">
                                             <span className="text-[10px] font-black tracking-tighter">RP {Number(lpj.total_realisasi).toLocaleString('id-ID')}</span>
                                             <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/50 border border-current opacity-70">{style.label}</span>
                                          </div>
                                          <div className="flex gap-2 mt-1">
                                             <button onClick={() => setViewLpj({...p, current_pj: lpj})} className="text-[9px] font-bold hover:underline">Lihat Detail</button>
                                             {(lpj.status === 'DRAFT' || lpj.status === 'REJECTED') && canCreate && (
                                               <button onClick={() => onSelectProposal(p, lpj)} className="text-[9px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform">
                                                  {lpj.status === 'REJECTED' ? '📝 Koreksi & Kirim' : '✎ Edit Draf'}
                                               </button>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                         </div>
                       )}
                    </div>

                    <div className="flex gap-2 items-center">
                       {balance > 0 && canCreate && (
                          <button 
                             onClick={() => isSelected ? setSelected(null) : onSelectProposal(p)} 
                             className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center gap-2 ${isSelected ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                             {isSelected ? '✕ Batal' : '+ Tambah Nota SPJ'}
                          </button>
                       )}
                       {balance <= 0 && <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">Lunas SPJ ✓</span>}
                    </div>
                 </div>

                 {/* FORM SPJ (Inline) */}
                 {isSelected && (
                    <div className="bg-blue-50/50 border-t border-blue-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
                       <div>
                          <h3 className="text-xl font-black text-blue-900 mb-1">Penyusunan Pertanggungjawaban</h3>
                          <p className="text-xs text-blue-500 font-medium italic">Silakan rincikan realisasi penggunaan dana per item nota / kwitansi.</p>
                       </div>

                       <div className="space-y-4">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Ringkasan Narasi Kegiatan</label>
                          <textarea required value={ringkasan} onChange={e => setRingkasan(e.target.value)} rows={3} className="w-full border-2 border-blue-100 rounded-2xl p-4 text-sm focus:ring-blue-500" placeholder="Jelaskan secara singkat pelaksanaan kegiatan, jumlah kehadiran, dan hasil yang dicapai..."></textarea>
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-4">
                             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Detail Realisasi (Per Item Nota)</label>
                             <button type="button" onClick={handleAddRow} className="text-blue-600 text-xs font-bold hover:underline">+ Tambah Baris Nota</button>
                          </div>
                          <div className="overflow-x-auto bg-white rounded-2xl shadow-inner border order-blue-100">
                             <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                                   <tr>
                                      <th className="px-4 py-3 text-left w-64">Kode Akun</th>
                                      <th className="px-4 py-3 text-left">Keterangan Nota</th>
                                      <th className="px-4 py-3 text-right w-48">Nominal (Rp)</th>
                                      <th className="px-4 py-3 w-12"></th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                   {details.map((row, i) => (
                                      <tr key={i}>
                                         <td className="px-2 py-3">
                                            <select value={row.account_id} onChange={e => updateDetail(i, 'account_id', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:ring-0 font-medium">
                                               <option value="">-- Akun --</option>
                                               {accounts.map(acc => <option key={acc.id} value={acc.id}>[{acc.nomor}] {acc.nama_akun}</option>)}
                                            </select>
                                         </td>
                                         <td className="px-2 py-3">
                                            <input type="text" value={row.keterangan} onChange={e => updateDetail(i, 'keterangan', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:ring-0" placeholder="Misal: Nota #01 - Konsumsi..." />
                                         </td>
                                         <td className="px-2 py-3">
                                            <input type="number" value={row.nominal} onChange={e => updateDetail(i, 'nominal', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:ring-0 text-right font-bold" placeholder="0" />
                                         </td>
                                         <td className="px-2 py-3 text-center">
                                            <button onClick={() => handleRemoveRow(i)} className="text-gray-300 hover:text-red-500">✕</button>
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                                <tfoot className="bg-blue-900 text-white font-bold">
                                   <tr>
                                      <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase opacity-70">Total Realisasi SPJ</td>
                                      <td className="px-4 py-3 text-right font-mono italic">Rp {calculateTotalRealisasi().toLocaleString('id-ID')}</td>
                                      <td></td>
                                   </tr>
                                </tfoot>
                             </table>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                           <div className="bg-muh-green/5 p-6 rounded-3xl border-2 border-muh-green/10">
                              <label className="block text-xs font-black text-muh-green uppercase mb-3 tracking-widest">Penanganan Sisa Dana (Rp { (selected.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - calculateTotalRealisasi()).toLocaleString('id-ID') })</label>
                              <div className="flex gap-4">
                                 <button 
                                    type="button"
                                    onClick={() => setOpsiSisa('KEMBALI')}
                                    className={`flex-1 p-3 rounded-2xl text-xs font-bold transition-all border-2 ${opsiSisa === 'KEMBALI' ? 'bg-muh-green text-white border-muh-green shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-muh-green/30'}`}
                                 >
                                    ↩ Kembalikan ke PDM
                                 </button>
                                 <button 
                                    type="button"
                                    onClick={() => setOpsiSisa('LANJUT')}
                                    className={`flex-1 p-3 rounded-2xl text-xs font-bold transition-all border-2 ${opsiSisa === 'LANJUT' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-300/30'}`}
                                 >
                                    ➕ Lanjutkan di Unit
                                 </button>
                              </div>
                              <p className="mt-3 text-[10px] text-gray-500 italic">
                                 {opsiSisa === 'KEMBALI' 
                                    ? '* Sisa dana akan disetorkan kembali ke Bendahara PDM setelah SPJ disetujui.' 
                                    : '* Sisa dana tetap diakui berada di Unit untuk keperluan kegiatan lainnya.'}
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                               <div>
                                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nama Pembuat (PIC)</label>
                                  <input type="text" value={namaPembuat} onChange={e => setNamaPembuat(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-blue-500" />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-xs font-black text-gray-400 uppercase mb-2">Bendahara Unit</label>
                                     <input type="text" value={namaBendahara} onChange={e => setNamaBendahara(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-blue-500" />
                                  </div>
                                  <div>
                                     <label className="block text-xs font-black text-gray-400 uppercase mb-2">Pimpinan Unit</label>
                                     <input type="text" value={namaPimpinan} onChange={e => setNamaPimpinan(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-blue-500" />
                                  </div>
                               </div>
                           </div>
                        </div>

                       <div className="flex justify-end gap-3 pt-6 border-t border-blue-200">
                          <button onClick={() => onSave('DRAFT')} disabled={submitting} className="px-6 py-3 rounded-xl font-bold text-blue-600 hover:bg-blue-100 transition">💾 Simpan Draf</button>
                          <button onClick={() => onSave('SUBMITTED')} disabled={submitting} className="px-10 py-3 rounded-xl font-black bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-1 active:scale-95 flex items-center gap-2">
                             {submitting ? '...' : '📤 Kirim SPJ Final'}
                          </button>
                       </div>
                    </div>
                 )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODAL (Enhanced) */}
      {viewLpj && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 stagger-fade-in">
               <div className="p-8 border-b flex justify-between items-start bg-gray-50/50 rounded-t-3xl">
                  <div>
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Lembar Pertanggungjawaban</p>
                     <h2 className="text-2xl font-black text-gray-900 leading-tight">{viewLpj.judul}</h2>
                  </div>
                  <button onClick={() => setViewLpj(null)} className="text-gray-300 hover:text-gray-600 text-3xl">✕</button>
               </div>

               <div className="p-8 space-y-10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                     <div className="bg-gray-50 p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status Laporan</p>
                        <p className={`text-xs font-black uppercase ${viewLpj.current_pj?.status === 'DRAFT' ? 'text-orange-500' : viewLpj.current_pj?.status === 'REJECTED' ? 'text-red-500' : 'text-emerald-600'}`}>
                           {viewLpj.current_pj?.status || 'BELUM ADA'}
                        </p>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Total Cair</p>
                        <p className="text-sm font-black text-blue-900">
                           Rp {(viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0).toLocaleString('id-ID')}
                        </p>
                     </div>
                     <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Nilai Nota Ini</p>
                        <p className="text-sm font-black text-emerald-700">
                           Rp {Number(viewLpj.current_pj?.total_realisasi || 0).toLocaleString('id-ID')}
                        </p>
                     </div>
                     <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-sm text-white">
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Sisa Dana</p>
                        <p className="text-sm font-black text-white">
                           Rp {Number(viewLpj.current_pj?.sisa_dana || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[8px] text-white/40 mt-1 uppercase font-bold tracking-tighter">Opsi: {viewLpj.current_pj?.opsi_sisa || 'KEMBALI'}</p>
                     </div>
                  </div>

                  {/* ALUR PERSETUJUAN SPJ */}
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                     <div className="flex-1">
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-2">Riwayat Pemeriksaan SPJ</p>
                        <div className="flex gap-2">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${viewLpj.current_pj?.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                              Step 1: Terbit ({viewLpj.current_pj?.nama_pembuat || 'PIC'})
                           </span>
                           {viewLpj.current_pj?.status === 'SUBMITTED' && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-blue-100 text-blue-700 animate-pulse">
                                 Step 2: Review Bendahara ({viewLpj.current_pj?.nama_bendahara || '-'})
                              </span>
                           )}
                           {viewLpj.current_pj?.status === 'APPROVED_FINAL' && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-emerald-600 text-white shadow-sm">
                                 Step 3: Final Pimpinan ({viewLpj.current_pj?.nama_pimpinan || '-'})
                              </span>
                           )}
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Status Akhir</p>
                        <p className="text-sm font-black text-gray-800 tracking-tighter">{viewLpj.current_pj?.status === 'SUBMITTED' ? 'MENUNGGU VERIFIKASI' : viewLpj.current_pj?.status}</p>
                     </div>
                  </div>

                  <div>
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">📜 Rincian Pengeluaran Nota</p>
                     <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                           <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                              <tr>
                                 <th className="px-6 py-4 text-left">Akun</th>
                                 <th className="px-6 py-4 text-left">Keterangan Item</th>
                                 <th className="px-6 py-4 text-right">Nominal</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {(viewLpj.current_pj?.details || []).map((item: any, idx: number) => (
                                 <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-mono text-[10px] text-gray-400">[{item.account?.nomor}] {item.account?.nama_akun}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{item.keterangan}</td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900 leading-tight">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot className="bg-gray-50/50">
                              <tr>
                                 <td colSpan={2} className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400">Total Nominal Nota</td>
                                 <td className="px-6 py-4 text-right font-black text-blue-600 underline">Rp {Number(viewLpj.current_pj?.total_realisasi || 0).toLocaleString('id-ID')}</td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">📝 Ringkasan Hasil Kegiatan</p>
                     <p className="text-sm text-gray-700 bg-gray-50 p-6 rounded-3xl leading-relaxed whitespace-pre-line border border-gray-100 italic">"{viewLpj.current_pj?.ringkasan || '-'}"</p>
                  </div>

                  <div className="bg-gray-50 p-4 mt-6 rounded-2xl flex flex-wrap gap-4 sm:gap-8 justify-between border border-gray-100 text-xs">
                     <p><span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold block mb-1">Dibuat Oleh</span> <span className="font-black text-gray-800">{viewLpj.current_pj?.nama_pembuat || '-'}</span></p>
                     <p><span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold block mb-1">Bendahara</span> <span className="font-black text-gray-800">{viewLpj.current_pj?.nama_bendahara || '-'}</span></p>
                     <p><span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold block mb-1">Pimpinan</span> <span className="font-black text-gray-800">{viewLpj.current_pj?.nama_pimpinan || '-'}</span></p>
                  </div>
               </div>

                <div className="p-8 bg-gray-50 border-t rounded-b-3xl flex justify-between gap-4">
                   <button 
                     onClick={() => window.print()} 
                     className="bg-white text-gray-800 border-2 border-gray-200 px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-gray-50 transition-all print:hidden"
                   >
                     📄 Cetak Lembar Nota / PDF
                   </button>
                   <button onClick={() => setViewLpj(null)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all print:hidden">Tutup Pratinjau</button>
                </div>
            </div>
         </div>
      )}

      {/* REKAP PROPOSAL MODAL */}
       {viewRekapProposal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 stagger-fade-in content-to-print print:shadow-none print:my-0">
                <div className="p-8 border-b flex justify-between items-start bg-blue-50/50 rounded-t-3xl print:bg-white">
                   <div>
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-1">Rekapitulasi Laporan Pertanggungjawaban (SPJ)</p>
                      <h2 className="text-2xl font-black text-gray-900 leading-tight print:text-black">{viewRekapProposal.judul}</h2>
                      <p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-widest">{viewRekapProposal.unit?.nama_unit}</p>
                   </div>
                   <button onClick={() => setViewRekapProposal(null)} className="text-gray-300 hover:text-gray-600 text-3xl print:hidden">✕</button>
                </div>

                <div className="p-8 space-y-8">
                   {(() => {
                      const totalCair = viewRekapProposal.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;
                      const allPj = viewRekapProposal.pertanggungjawabans?.filter((pj: any) => pj.status !== 'REJECTED') || [];
                      const totalReal = allPj.reduce((s: number, pj: any) => s + Number(pj.total_realisasi), 0);
                      const sisaDana = totalCair - totalReal;
                      
                      return (
                         <>
                            <div className="grid grid-cols-3 gap-6 text-center">
                               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest">Total Anggaran Cair</p>
                                  <p className="text-xl font-black text-gray-800">Rp {totalCair.toLocaleString('id-ID')}</p>
                               </div>
                               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                  <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1 tracking-widest">Total Realisasi (Kumulatif)</p>
                                  <p className="text-xl font-black text-emerald-700">Rp {totalReal.toLocaleString('id-ID')}</p>
                               </div>
                               <div className={`${sisaDana > 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} p-4 rounded-xl border`}>
                                  <p className={`text-[10px] font-bold uppercase mb-1 tracking-widest ${sisaDana > 0 ? 'text-orange-500' : 'text-blue-500'}`}>
                                     Sisa Kumulatif
                                  </p>
                                  <p className={`text-xl font-black ${sisaDana > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                                     Rp {sisaDana.toLocaleString('id-ID')}
                                  </p>
                               </div>
                            </div>

                            <div>
                               <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Daftar Nota Realisasi Terkait Usulan Ini:</p>
                               {allPj.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic">Belum ada nota yang dilaporkan.</p>
                               ) : (
                                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                     <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-500 border-b border-gray-200">
                                           <tr>
                                              <th className="px-5 py-3 text-left w-24">Tgl Lapor</th>
                                              <th className="px-5 py-3 text-left">Ringkasan & Rincian Nota</th>
                                              <th className="px-5 py-3 text-right w-36">Realisasi (Rp)</th>
                                              <th className="px-5 py-3 text-center w-24 print:hidden">Status</th>
                                           </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                           {allPj.map((pj: any, i: number) => (
                                              <tr key={i} className="hover:bg-gray-50 align-top">
                                                 <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(pj.tanggal_laporan).toLocaleDateString('id-ID')}</td>
                                                 <td className="px-5 py-3">
                                                    <p className="text-xs text-gray-700 font-semibold mb-2">{pj.ringkasan}</p>
                                                    {pj.details && pj.details.length > 0 && (
                                                       <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                                          <table className="w-full text-[11px]">
                                                             <tbody className="divide-y divide-gray-100">
                                                                {pj.details.map((det: any, j: number) => (
                                                                   <tr key={j}>
                                                                      <td className="px-3 py-1.5 text-gray-500">{det.account?.nomor ? `[${det.account.nomor}]` : ''} {det.keterangan || 'Item'}</td>
                                                                      <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-700 whitespace-nowrap">Rp {Number(det.nominal).toLocaleString('id-ID')}</td>
                                                                   </tr>
                                                                ))}
                                                             </tbody>
                                                          </table>
                                                       </div>
                                                    )}
                                                 </td>
                                                 <td className="px-5 py-3 text-right font-black text-emerald-600 whitespace-nowrap">Rp {Number(pj.total_realisasi).toLocaleString('id-ID')}</td>
                                                 <td className="px-5 py-3 text-center print:hidden">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${pj.status === 'APPROVED_FINAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                       {pj.status === 'APPROVED_FINAL' ? 'SELESAI' : 'DRAFT'}
                                                    </span>
                                                 </td>
                                              </tr>
                                           ))}
                                        </tbody>
                                        <tfoot className="bg-blue-900 text-white print:bg-gray-100 print:text-black">
                                           <tr>
                                              <td colSpan={2} className="px-5 py-3 text-right text-xs uppercase font-bold tracking-widest opacity-80 print:text-gray-600">Total Pengeluaran SPJ Kumulatif:</td>
                                              <td className="px-5 py-3 text-right font-black text-lg text-emerald-300 shadow-inner tracking-tight print:text-black">Rp {totalReal.toLocaleString('id-ID')}</td>
                                              <td className="print:hidden"></td>
                                           </tr>
                                        </tfoot>
                                     </table>
                                  </div>
                               )}
                            </div>
                         </>
                      );
                   })()}
                </div>

                <div className="p-6 bg-gray-50 border-t rounded-b-3xl flex justify-between print:hidden">
                   <button 
                     onClick={() => window.print()} 
                     className="bg-white text-purple-700 border-2 border-purple-200 px-6 py-2 rounded-xl font-black text-sm hover:bg-purple-50 transition-all font-mono"
                   >
                     🚀 Cetak Buku Rekap Usulan (PDF)
                   </button>
                   <button onClick={() => setViewRekapProposal(null)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold">Tutup Lembar Rekap</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
