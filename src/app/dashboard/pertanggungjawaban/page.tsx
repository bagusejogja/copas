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
  const [ringkasan, setRingkasan] = useState('');
  const [details, setDetails] = useState([{ account_id: '', keterangan: '', nominal: '' }]);
  const [namaPembuat, setNamaPembuat] = useState('');
  const [namaBendahara, setNamaBendahara] = useState('');
  const [namaPimpinan, setNamaPimpinan] = useState('');
  const [opsiSisa, setOpsiSisa] = useState<'KEMBALI' | 'LANJUT'>('KEMBALI');
  const [submitting, setSubmitting] = useState(false);

  // View Modal
  const [viewLpj, setViewLpj] = useState<any | null>(null);

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

  const onSelectProposal = (p: any) => {
    setSelected(p);
    if (p.pertanggungjawabans?.length > 0) {
      const lpj = p.pertanggungjawabans[0];
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
      // New SPJ
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
    
    // Validation: Realization cannot exceed Approved Proposal Amount
    const totalRAB = selected.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;
    const totalReal = calculateTotalRealisasi();
    if (totalReal > totalRAB) {
       alert(`Maaf, total realisasi (Rp ${totalReal.toLocaleString('id-ID')}) tidak boleh melebihi anggaran yang disetujui (Rp ${totalRAB.toLocaleString('id-ID')}).`);
       return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pertanggungjawaban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
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
      'PAID': { label: 'Dibayar Bendahara', css: 'bg-emerald-100 text-emerald-800' },
    };
    const s = map[status] || { label: status, css: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.css}`}>{s.label}</span>;
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
            const hasLpj = p.pertanggungjawabans?.length > 0;
            const lpjStatus = hasLpj ? p.pertanggungjawabans[0].status : null;
            const isSelected = selected?.id === p.id;
            const totalRAB = p.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;

            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-400 ring-4 ring-blue-50' : hasLpj ? 'border-emerald-100' : 'border-gray-100'}`}>
                 <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded font-mono">#USL-{p.id}</span>
                          {getStatusBadge(p.status_terakhir)}
                          {hasLpj && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              lpjStatus === 'DRAFT' ? 'bg-orange-100 text-orange-800' : 
                              lpjStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-emerald-600 text-white shadow-sm'
                            }`}>
                              {lpjStatus === 'DRAFT' ? '📝 Draf SPJ' : lpjStatus === 'REJECTED' ? '❌ SPJ Ditolak' : '✅ SPJ Terkirim'}
                            </span>
                          )}
                       </div>
                       <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">{p.judul}</h2>
                       <div className="mt-3 flex gap-4 text-xs font-medium text-gray-400">
                          <span className="flex items-center gap-1">📅 {new Date(p.tanggal).toLocaleDateString('id-ID')}</span>
                          <span className="flex items-center gap-1">🏢 {p.unit?.nama_unit}</span>
                          <span className="flex items-center gap-1 font-bold text-muh-green">💰 Anggaran: Rp {totalRAB.toLocaleString('id-ID')}</span>
                       </div>
                    </div>

                    <div className="flex gap-2 items-center">
                       {hasLpj ? (
                          <div className="flex gap-2">
                             <button onClick={() => setViewLpj(p)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2">👁 Lihat {lpjStatus === 'REJECTED' ? 'Alasan' : 'LPJ'}</button>
                             {(lpjStatus === 'DRAFT' || lpjStatus === 'REJECTED') && canCreate && (
                               <button onClick={() => onSelectProposal(p)} className={`${lpjStatus === 'REJECTED' ? 'bg-red-50 text-red-600 hover:bg-red-600' : 'bg-orange-50 text-orange-600 hover:bg-orange-600'} hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2}`}>
                                  {lpjStatus === 'REJECTED' ? '✎ Perbaiki' : '✎ Lanjutkan'}
                               </button>
                             )}
                          </div>
                       ) : (
                          canCreate && (
                             <button onClick={() => isSelected ? setSelected(null) : onSelectProposal(p)} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${isSelected ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                {isSelected ? '✕ Batal' : '+ Buat SPJ'}
                             </button>
                          )
                       )}
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
                        <p className={`text-xs font-black uppercase ${viewLpj.pertanggungjawabans?.[0]?.status === 'DRAFT' ? 'text-orange-500' : 'text-emerald-600'}`}>
                           {viewLpj.pertanggungjawabans?.[0]?.status || 'BELUM ADA'}
                        </p>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Disetujui (RAB)</p>
                        <p className="text-sm font-black text-blue-900">
                           Rp {(viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0).toLocaleString('id-ID')}
                        </p>
                     </div>
                     <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Realisasi (Nota)</p>
                        <p className="text-sm font-black text-emerald-700">
                           Rp {Number(viewLpj.pertanggungjawabans?.[0]?.total_realisasi || 0).toLocaleString('id-ID')}
                        </p>
                     </div>
                     <div className={`p-4 rounded-2xl shadow-sm border ${
                        (viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - (viewLpj.pertanggungjawabans?.[0]?.total_realisasi || 0)) < 0 
                        ? 'bg-red-50 border-red-100' : 'bg-gray-900 border-gray-800'
                     }`}>
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Sisa Anggaran</p>
                        <p className={`text-sm font-black ${
                           (viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - (viewLpj.pertanggungjawabans?.[0]?.total_realisasi || 0)) < 0 
                           ? 'text-red-600' : 'text-white'
                        }`}>
                           Rp {(viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - (viewLpj.pertanggungjawabans?.[0]?.total_realisasi || 0)).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[8px] text-white/40 mt-1 uppercase font-bold tracking-tighter">Opsi: {viewLpj.pertanggungjawabans?.[0]?.opsi_sisa || 'KEMBALI'}</p>
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
                              {viewLpj.pertanggungjawabans?.[0]?.details?.map((item: any, idx: number) => (
                                 <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-mono text-xs">[{item.account?.nomor}] {item.account?.nama_akun}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.keterangan}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">📝 Ringkasan Hasil Kegiatan</p>
                     <p className="text-sm text-gray-700 bg-gray-50 p-6 rounded-3xl leading-relaxed whitespace-pre-line border border-gray-100 italic">"{viewLpj.pertanggungjawabans?.[0]?.ringkasan}"</p>
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-100 text-center">
                     <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-8">Pihak Pertama (PIC)</p>
                        <p className="text-sm font-black border-b border-gray-900 pb-1">{viewLpj.pertanggungjawabans?.[0]?.nama_pembuat || '-'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-8">Bendahara Unit</p>
                        <p className="text-sm font-black border-b border-gray-900 pb-1">{viewLpj.pertanggungjawabans?.[0]?.nama_bendahara || '-'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-8">Pimpinan Unit</p>
                        <p className="text-sm font-black border-b border-gray-900 pb-1">{viewLpj.pertanggungjawabans?.[0]?.nama_pimpinan || '-'}</p>
                     </div>
                  </div>
               </div>

                <div className="p-8 bg-gray-50 border-t rounded-b-3xl flex justify-between gap-4">
                   <button 
                     onClick={() => window.print()} 
                     className="bg-white text-gray-800 border-2 border-gray-200 px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
                   >
                     📄 Cetak Laporan / PDF
                   </button>
                   <button onClick={() => setViewLpj(null)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">Tutup Pratinjau</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
