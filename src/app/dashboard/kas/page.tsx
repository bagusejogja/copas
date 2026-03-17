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

  const fetchKas = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.set('unit_id', filterUnit);

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

  useEffect(() => { fetchKas(); }, [filterUnit]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Buku Kas</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Rekapitulasi Arus Kas & Pembayaran Anggaran</p>
        </div>
      </div>

      {/* FILTER PANEL (For PDM / Admin) */}
      {(user?.role?.level === 99 || user?.unit?.id === 1) && (
        <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pilih Pantauan Unit / Majelis</label>
              <select 
                value={filterUnit} 
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full border-gray-100 rounded-xl p-2.5 text-xs focus:ring-muh-green font-bold"
              >
                <option value="">-- Unit Saya (Default) --</option>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-emerald-500">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Total Pemasukan</p>
            <p className="text-2xl font-black text-emerald-600">Rp {stats.masuk.toLocaleString('id-ID')}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-red-500">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Total Pengeluaran</p>
            <p className="text-2xl font-black text-red-600">Rp {stats.keluar.toLocaleString('id-ID')}</p>
         </div>
         <div className="bg-gray-900 p-6 rounded-3xl shadow-xl">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1 text-white/50">Saldo Kas</p>
            <p className="text-2xl font-black text-white">Rp {stats.saldo.toLocaleString('id-ID')}</p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
         <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
               <tr>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                  <th className="px-6 py-4 text-left">Keterangan / Deskripsi</th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">Kategori</th>
                  <th className="px-6 py-4 text-right">Debit (In)</th>
                  <th className="px-6 py-4 text-right">Kredit (Out)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400">Memuat data kas...</td></tr>
               ) : records.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Belum ada transaksi di buku kas untuk unit ini.</td></tr>
               ) : records.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition">
                     <td className="px-6 py-4 font-mono text-xs text-gray-400">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                     <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{r.deskripsi}</p>
                        {r.proposal_id && <p className="text-[10px] text-blue-500 font-mono mt-0.5">Ref: #USL-{r.proposal_id}</p>}
                     </td>
                     <td className="px-6 py-4 text-xs font-semibold text-gray-500 lowercase"><span className="bg-gray-100 px-2 py-1 rounded-lg">{r.kategori || 'umum'}</span></td>
                     <td className="px-6 py-4 text-right font-black text-emerald-600">{r.tipe === 'MASUK' ? `Rp ${Number(r.nominal).toLocaleString('id-ID')}` : '-'}</td>
                     <td className="px-6 py-4 text-right font-black text-red-600">{r.tipe === 'KELUAR' ? `Rp ${Number(r.nominal).toLocaleString('id-ID')}` : '-'}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
