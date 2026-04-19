"use client";
import { useState, useEffect } from 'react';

export default function SPJApprovalPage() {
  const [lpjs, setLpjs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Filters
  const [filterUnit, setFilterUnit] = useState('');

  useEffect(() => { 
    fetchInitialData(); 
  }, [filterUnit]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.set('unit_id', filterUnit);

      const [resLpj, resUnits, resMe] = await Promise.all([
        fetch('/api/pertanggungjawaban/approve?' + query.toString()),
        fetch('/api/units'),
        fetch('/api/auth/me')
      ]);
      
      const dataLpj = await resLpj.json();
      const dataUnits = await resUnits.json();
      const dataMe = await resMe.json();
      setUser(dataMe);
      
      
      setLpjs(Array.isArray(dataLpj) ? dataLpj : []);
      setUnits(Array.isArray(dataUnits) ? dataUnits : []);
    } finally { setLoading(false); }
  };

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Yakin ingin ${action === 'APPROVE' ? 'menyetujui' : 'menolak'} laporan ini?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/pertanggungjawaban/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lpj_id: id, action })
      });
      if (res.ok) { fetchInitialData(); }
      else { const err = await res.json(); alert(err.message); }
    } finally { setProcessingId(null); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Verifikasi SPJ</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Persetujuan Laporan Pertanggungjawaban Realisasi Dana</p>
        </div>
      </div>

      {/* FILTER PANEL */}
      {(user?.role?.level === 99 || user?.unit?.id === 1) && (
        <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter Majelis / Unit</label>
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

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-muh-green/20 border-t-muh-green rounded-full animate-spin"></div>
          </div>
        ) : lpjs.length === 0 ? (
          <div className="p-20 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-bold text-gray-800">Antrean Bersih</h3>
            <p className="text-gray-400 text-sm mt-1 italic">Tidak ada laporan SPJ yang menunggu persetujuan saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b">
                <tr>
                   <th className="px-6 py-5 text-left">Informasi Usulan & Unit</th>
                   <th className="px-6 py-5 text-right w-40">Dana Cair (Awal)</th>
                   <th className="px-6 py-5 text-right w-40">Realisasi (Final)</th>
                   <th className="px-6 py-5 text-center w-48">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lpjs.map(lpj => {
                   const totalCair = lpj.proposal.details.reduce((s:number, d:any) => s + Number(d.nominal), 0);
                   const isWaiting = lpj.status === 'SUBMITTED';
                   return (
                    <tr key={lpj.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-bold shadow-lg">
                              #{lpj.id}
                           </div>
                           <div>
                              <p className="font-black text-gray-900 leading-tight">{lpj.proposal.judul}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-bold text-muh-green uppercase tracking-wider opacity-70">🏢 {lpj.proposal.unit.nama_unit}</p>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${lpj.status === 'APPROVED_FINAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {lpj.status}
                                </span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs font-bold text-gray-400">
                        Rp {totalCair.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black font-mono text-xs">
                           Rp {Number(lpj.total_realisasi).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {isWaiting ? (
                            <>
                              <button 
                                disabled={processingId === lpj.id}
                                onClick={() => handleAction(lpj.id, 'REJECT')}
                                className="bg-red-50 text-red-600 w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                                title="Tolak SPJ"
                              >
                                ✕
                              </button>
                              <button 
                                disabled={processingId === lpj.id}
                                onClick={() => handleAction(lpj.id, 'APPROVE')}
                                className="px-4 py-2 bg-muh-green text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg hover:shadow-muh-green/20"
                              >
                                {processingId === lpj.id ? '...' : '✓ SETUJUI SPJ'}
                              </button>
                            </>
                          ) : (
                            <button 
                              disabled={processingId === lpj.id}
                              onClick={() => handleAction(lpj.id, 'REVERT_DRAFT' as any)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg font-bold text-[10px] hover:bg-orange-100 hover:text-orange-600 transition-all"
                            >
                              ↩ Kembalikan ke Draft
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
    </div>
  );
}
