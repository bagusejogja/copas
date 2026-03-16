"use client";
import { useState, useEffect } from 'react';

export default function SPJApprovalPage() {
  const [lpjs, setLpjs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => { fetchLPJs(); }, []);

  const fetchLPJs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pertanggungjawaban/approve');
      const data = await res.json();
      setLpjs(Array.isArray(data) ? data : []);
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
      if (res.ok) { fetchLPJs(); }
      else { const err = await res.json(); alert(err.message); }
    } finally { setProcessingId(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Persetujuan Laporan (SPJ)</h1>
        <p className="mt-1 text-gray-600 text-sm">Verifikasi laporan pertanggungjawaban dana yang telah dikirim oleh unit.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : lpjs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic">
            Tidak ada laporan SPJ yang menunggu persetujuan saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-4">Usulan & Unit</th>
                  <th className="px-5 py-4 text-right">Dana Cair</th>
                  <th className="px-5 py-4 text-right">Realisasi LPJ</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lpjs.map(lpj => {
                   const danaCair = lpj.proposal.details.reduce((s:number, d:any) => s + Number(d.nominal), 0);
                   return (
                    <tr key={lpj.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{lpj.proposal.judul}</p>
                        <p className="text-xs text-gray-500">{lpj.proposal.unit.nama_unit} · {lpj.proposal.pemohon.nama}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-600">
                        Rp {danaCair.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-blue-700">
                        Rp {Number(lpj.total_realisasi).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            disabled={processingId === lpj.id}
                            onClick={() => handleAction(lpj.id, 'REJECT')}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition"
                          >
                            ✗ Tolak
                          </button>
                          <button 
                            disabled={processingId === lpj.id}
                            onClick={() => handleAction(lpj.id, 'APPROVE')}
                            className="bg-muh-green text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-muh-green-dark shadow-sm"
                          >
                            ✓ Setuju
                          </button>
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
