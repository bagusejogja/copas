"use client";
import { useState, useEffect } from 'react';

export default function KasPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ masuk: 0, keluar: 0, saldo: 0 });
  
  // Filters
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fmt = (n: number) => n.toLocaleString('id-ID');

  const fetchKas = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.set('unit_id', filterUnit);
      if (filterFrom) query.set('from', filterFrom);
      if (filterTo) query.set('to', filterTo);

      const resKas = await fetch('/api/kas?' + query.toString());
      const data = await resKas.json();
      if (Array.isArray(data)) {
        setRecords(data);
        const m = data.filter(r => r.tipe === 'MASUK').reduce((s, r) => s + Number(r.nominal), 0);
        const k = data.filter(r => r.tipe === 'KELUAR').reduce((s, r) => s + Number(r.nominal), 0);
        setStats({ masuk: m, keluar: k, saldo: m - k });
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      setUser(data);
      if (data?.role?.level === 99 || data?.unit?.id === 1) {
        fetch('/api/units').then(r => r.json()).then(setUnits);
      }
    });
  }, []);

  useEffect(() => { fetchKas(); }, [filterUnit, filterFrom, filterTo]);

  const handleExportExcel = async () => {
    const query = new URLSearchParams();
    if (filterUnit) query.set('unit_id', filterUnit);
    if (filterFrom) query.set('from', filterFrom);
    if (filterTo) query.set('to', filterTo);
    query.set('export', 'excel');

    const res = await fetch('/api/kas/export?' + query.toString());
    if (!res.ok) { alert('Gagal mengunduh file.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku-kas-${filterFrom || 'all'}-${filterTo || 'all'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate running balance
  let runningBalance = 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Buku Kas</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Rekapitulasi Arus Kas & Pembayaran Anggaran</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download Excel
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-4">
         {/* Unit filter (PDM/Admin only) */}
         {(user?.role?.level === 99 || user?.unit?.id === 1) && (
           <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unit / Majelis</label>
              <select 
                value={filterUnit} 
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full border-gray-200 rounded-xl p-2.5 text-xs focus:ring-muh-green font-bold"
              >
                <option value="">-- Semua Unit --</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.nama_unit}</option>
                ))}
              </select>
           </div>
         )}

         {/* Date range filter */}
         <div className="min-w-[150px]">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dari Tanggal</label>
            <input 
              type="date" 
              value={filterFrom} 
              onChange={e => setFilterFrom(e.target.value)}
              className="w-full border-gray-200 rounded-xl p-2.5 text-xs focus:ring-muh-green font-bold"
            />
         </div>
         <div className="min-w-[150px]">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              value={filterTo} 
              onChange={e => setFilterTo(e.target.value)}
              className="w-full border-gray-200 rounded-xl p-2.5 text-xs focus:ring-muh-green font-bold"
            />
         </div>

         {(filterUnit || filterFrom || filterTo) && (
           <button 
             onClick={() => { setFilterUnit(''); setFilterFrom(''); setFilterTo(''); }}
             className="text-xs text-red-500 font-bold hover:underline pb-2"
           >
             ✕ Reset Semua
           </button>
         )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-emerald-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg className="w-20 h-20 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2v20m8-10H4"/></svg>
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Total Pemasukan</p>
            <p className="text-2xl font-black text-emerald-600">Rp {fmt(stats.masuk)}</p>
            <p className="text-[9px] text-gray-400 mt-1">{records.filter(r => r.tipe === 'MASUK').length} transaksi masuk</p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-red-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg className="w-20 h-20 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M20 12H4"/></svg>
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Total Pengeluaran</p>
            <p className="text-2xl font-black text-red-600">Rp {fmt(stats.keluar)}</p>
            <p className="text-[9px] text-gray-400 mt-1">{records.filter(r => r.tipe === 'KELUAR').length} transaksi keluar</p>
         </div>
         <div className="bg-gray-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <p className="text-[10px] text-white/50 font-black uppercase mb-1 tracking-widest relative">Saldo Kas Akhir</p>
            <p className={`text-2xl font-black relative ${stats.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Rp {fmt(stats.saldo)}</p>
            <p className="text-[9px] text-white/30 mt-1 relative">{records.length} total transaksi</p>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
         <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
               <tr>
                  <th className="px-5 py-4 text-left w-24">Tanggal</th>
                  <th className="px-5 py-4 text-left">Keterangan / Deskripsi</th>
                  <th className="px-5 py-4 text-left w-28">Kategori</th>
                  <th className="px-5 py-4 text-right w-36">Debit (In)</th>
                  <th className="px-5 py-4 text-right w-36">Kredit (Out)</th>
                  <th className="px-5 py-4 text-right w-40 bg-gray-100 font-black">Saldo</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-muh-green/30 border-t-muh-green rounded-full animate-spin"></div>
                      Memuat data kas...
                    </div>
                  </td></tr>
               ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-500 font-bold">Belum ada transaksi di buku kas.</p>
                    <p className="text-gray-400 text-xs italic mt-1">Data akan muncul otomatis setelah ada pencairan dana dari usulan anggaran.</p>
                  </td></tr>
               ) : records.map((r, i) => {
                  const nominal = Number(r.nominal);
                  if (r.tipe === 'MASUK') runningBalance += nominal;
                  else runningBalance -= nominal;
                  
                  return (
                    <tr key={i} className="hover:bg-gray-50/70 transition group">
                       <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                       <td className="px-5 py-3.5">
                          <p className="font-bold text-gray-800 text-sm leading-tight">{r.deskripsi}</p>
                          {r.proposal_id && <p className="text-[10px] text-blue-500 font-mono mt-0.5 opacity-70 group-hover:opacity-100">Ref: #USL-{r.proposal_id}</p>}
                       </td>
                       <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${r.tipe === 'MASUK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {r.kategori || 'umum'}
                          </span>
                       </td>
                       <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                          {r.tipe === 'MASUK' ? `Rp ${fmt(nominal)}` : <span className="text-gray-200">-</span>}
                       </td>
                       <td className="px-5 py-3.5 text-right font-mono font-bold text-red-500">
                          {r.tipe === 'KELUAR' ? `Rp ${fmt(nominal)}` : <span className="text-gray-200">-</span>}
                       </td>
                       <td className={`px-5 py-3.5 text-right font-mono font-black bg-gray-50/50 ${runningBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                          Rp {fmt(runningBalance)}
                       </td>
                    </tr>
                  );
               })}
            </tbody>
            {records.length > 0 && (
              <tfoot className="bg-blue-900 text-white font-bold">
                 <tr>
                    <td colSpan={3} className="px-5 py-4 text-right text-xs uppercase tracking-widest opacity-70">TOTAL</td>
                    <td className="px-5 py-4 text-right font-mono text-emerald-300 font-black">Rp {fmt(stats.masuk)}</td>
                    <td className="px-5 py-4 text-right font-mono text-red-300 font-black">Rp {fmt(stats.keluar)}</td>
                    <td className="px-5 py-4 text-right font-mono text-white font-black text-base">Rp {fmt(stats.saldo)}</td>
                 </tr>
              </tfoot>
            )}
         </table>
      </div>
    </div>
  );
}
