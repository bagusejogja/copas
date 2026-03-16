"use client";
import { useState, useEffect } from 'react';

export default function PaguManagementPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [localPagu, setLocalPagu] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pagu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUnits(data);
        const mapping: Record<number, string> = {};
        data.forEach(u => {
          const p = u.paguRecords.find((r: any) => r.tahun === selectedYear);
          mapping[u.id] = p ? String(p.nominal) : '0';
        });
        setLocalPagu(mapping);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, [selectedYear]);

  const handleUpdateLocal = (unitId: number, val: string) => {
    setLocalPagu(prev => ({ ...prev, [unitId]: val }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const unitId in localPagu) {
        await fetch('/api/pagu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unit_id: unitId, tahun: selectedYear, nominal: localPagu[unitId] })
        });
      }
      alert('Semua Pagu berhasil disimpan!');
      fetchUnits();
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Pagu Unit</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Penetapan Batas Maksimal Anggaran Unit per Tahun</p>
        </div>
         <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
              <span className="text-xs font-black text-gray-400 uppercase px-2">Cari Unit:</span>
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nama unit..."
                className="border-0 focus:ring-0 font-bold text-sm bg-transparent w-40"
              />
           </div>
           <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
              <span className="text-xs font-black text-gray-400 uppercase px-2">Tahun:</span>
              <select 
                 value={selectedYear} 
                 onChange={e => setSelectedYear(Number(e.target.value))}
                 className="border-0 focus:ring-0 font-bold text-muh-green bg-transparent"
              >
                 {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <button 
             onClick={handleSaveAll}
             disabled={saving}
             className="bg-muh-green text-white px-8 py-3.5 rounded-2xl font-black shadow-lg hover:bg-muh-green-dark transition-all disabled:opacity-50"
           >
             {saving ? 'Menyimpan...' : 'Simpan Semua'}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
         <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
               <tr>
                  <th className="px-8 py-5 text-left">Nama Unit Kerja</th>
                  <th className="px-8 py-5 text-right w-64">Pagu Maksimal (Rp)</th>
                  <th className="px-8 py-5 text-right">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center"><div className="w-8 h-8 border-4 border-muh-green/20 border-t-muh-green rounded-full animate-spin mx-auto"></div></td></tr>
               ) : units.filter(u => u.nama_unit.toLowerCase().includes(search.toLowerCase())).map(u => {
                  const currentPagu = u.paguRecords.find((r: any) => r.tahun === selectedYear);
                  return (
                     <tr key={u.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-8 py-5">
                           <p className="font-bold text-gray-800 text-base">{u.nama_unit}</p>
                           <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: #UNT-{u.id}</p>
                        </td>
                         <td className="px-8 py-5 text-right font-mono font-bold text-lg text-gray-900">
                            Rp {(Number(localPagu[u.id]) || 0).toLocaleString('id-ID')}
                            <input 
                               type="number" 
                               value={localPagu[u.id] || 0}
                               onChange={(e) => handleUpdateLocal(u.id, e.target.value)}
                               className="block w-full mt-2 text-xs border border-gray-100 rounded p-1 text-right focus:border-muh-green focus:ring-0"
                               placeholder="Edit nominal..."
                            />
                         </td>
                        <td className="px-8 py-5 text-right">
                           {currentPagu ? (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Aktif</span>
                           ) : (
                              <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Belum Set</span>
                           )}
                        </td>
                     </tr>
                  );
               })}
            </tbody>
            {!loading && (
               <tfoot className="bg-gray-900 text-white font-black">
                  <tr>
                     <td className="px-8 py-6 text-xl uppercase tracking-widest text-white/50">Total Anggaran Pagu {selectedYear}</td>
                     <td className="px-8 py-6 text-right font-mono text-2xl text-muh-green">
                        Rp {Object.values(localPagu).reduce((sum, val) => sum + Number(val || 0), 0).toLocaleString('id-ID')}
                     </td>
                     <td></td>
                  </tr>
               </tfoot>
            )}
         </table>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-center">
         <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">ℹ️</div>
         <div>
            <p className="font-bold text-blue-900">Informasi Pagu</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">Nilai nominal yang Bapak masukkan akan menjadi batas maksimal total anggaran yang bisa diajukan oleh unit tersebut dalam satu tahun. Unit tidak akan bisa menyimpan Program Kerja jika total anggaran Proker mereka melebihi Pagu ini.</p>
         </div>
      </div>
    </div>
  );
}
