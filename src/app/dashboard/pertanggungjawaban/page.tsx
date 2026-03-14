"use client";
import { useState, useEffect } from 'react';

export default function LaporanPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  // LPJ Form
  const [ringkasan, setRingkasan] = useState('');
  const [realisasi, setRealisasi] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View existing LPJ
  const [viewLpj, setViewLpj] = useState<any | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pertanggungjawaban');
      const data = await res.json();
      if (Array.isArray(data)) setProposals(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProposals(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/pertanggungjawaban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: selected.id, ringkasan, total_realisasi: realisasi })
      });
      if (res.ok) {
        setSelected(null); setRingkasan(''); setRealisasi('');
        fetchProposals();
      } else {
        const err = await res.json(); alert(err.message);
      }
    } finally { setSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED_LV1: 'bg-blue-100 text-blue-800',
      APPROVED_LV2: 'bg-indigo-100 text-indigo-800',
      APPROVED_FINAL: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'Menunggu', APPROVED_LV1: 'Disetujui Atasan',
      APPROVED_LV2: 'Review Pusat', APPROVED_FINAL: 'Cair/Final', REJECTED: 'Ditolak',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Pertanggungjawaban (LPJ)</h1>
        <p className="mt-1 text-gray-600 text-sm">Buat LPJ untuk setiap proposal yang telah dicairkan (status Final).</p>
      </div>

      {/* Modal View LPJ */}
      {viewLpj && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muh-green-dark text-white rounded-t-2xl">
              <div>
                <p className="text-xs text-green-200 font-mono">LPJ #{viewLpj.id}</p>
                <h2 className="font-bold text-lg">{viewLpj.judul}</h2>
              </div>
              <button onClick={() => setViewLpj(null)} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Proposal Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Jenis Kegiatan</p><p className="text-sm font-medium">{viewLpj.activity_type?.nama}</p></div>
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Tanggal Pengajuan</p><p className="text-sm font-medium">{new Date(viewLpj.tanggal).toLocaleDateString('id-ID')}</p></div>
                {viewLpj.waktu_pelaksanaan && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Waktu Pelaksanaan</p><p className="text-sm">{new Date(viewLpj.waktu_pelaksanaan).toLocaleDateString('id-ID')}</p></div>}
                {viewLpj.jumlah_peserta && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Jumlah Peserta</p><p className="text-sm">{viewLpj.jumlah_peserta} orang</p></div>}
              </div>
              {/* RAB */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">RAB yang Disetujui</p>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600"><tr><th className="px-4 py-2 text-left">Deskripsi</th><th className="px-4 py-2 text-right">Nominal</th></tr></thead>
                  <tbody className="divide-y">
                    {viewLpj.details?.map((d: any) => (
                      <tr key={d.id}><td className="px-4 py-2">{d.deskripsi}</td><td className="px-4 py-2 text-right font-mono">Rp {Number(d.nominal).toLocaleString('id-ID')}</td></tr>
                    ))}
                    <tr className="bg-green-50 font-bold">
                      <td className="px-4 py-2 text-right">TOTAL RAB:</td>
                      <td className="px-4 py-2 text-right font-mono">Rp {viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0).toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* LPJ Detail */}
              {viewLpj.pertanggungjawabans?.[0] && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="font-bold text-blue-900 text-sm">📝 Laporan Pertanggungjawaban</p>
                  <div><p className="text-xs text-blue-500 font-semibold uppercase mb-1">Tanggal Laporan</p><p className="text-sm">{new Date(viewLpj.pertanggungjawabans[0].tanggal_laporan).toLocaleDateString('id-ID')}</p></div>
                  <div><p className="text-xs text-blue-500 font-semibold uppercase mb-1">Ringkasan Kegiatan</p><p className="text-sm whitespace-pre-line">{viewLpj.pertanggungjawabans[0].ringkasan}</p></div>
                  <div className="flex gap-6">
                    <div><p className="text-xs text-blue-500 font-semibold uppercase mb-1">Total RAB</p><p className="font-mono font-bold">Rp {viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0).toLocaleString('id-ID')}</p></div>
                    <div><p className="text-xs text-blue-500 font-semibold uppercase mb-1">Total Realisasi</p><p className="font-mono font-bold text-green-700">Rp {Number(viewLpj.pertanggungjawabans[0].total_realisasi).toLocaleString('id-ID')}</p></div>
                    <div>
                      <p className="text-xs text-blue-500 font-semibold uppercase mb-1">Selisih</p>
                      <p className={`font-mono font-bold ${(viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - Number(viewLpj.pertanggungjawabans[0].total_realisasi)) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        Rp {(viewLpj.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) - Number(viewLpj.pertanggungjawabans[0].total_realisasi)).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => setViewLpj(null)} className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-200">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading ? <p className="p-10 text-center text-gray-500">Memuat data...</p> :
        proposals.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border shadow-sm">
            <p className="text-gray-400 text-4xl mb-3">📂</p>
            <p className="font-bold text-gray-700">Belum ada Usulan dengan status Final</p>
            <p className="text-gray-500 text-sm mt-1">LPJ hanya bisa dibuat untuk usulan yang sudah berstatus APPROVED_FINAL.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map(p => {
              const hasLpj = p.pertanggungjawabans?.length > 0;
              const total = p.details?.reduce((s: number, d: any) => s + Number(d.nominal), 0) || 0;
              const isSelected = selected?.id === p.id;

              return (
                <div key={p.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition ${isSelected ? 'border-blue-300' : hasLpj ? 'border-green-200' : 'border-gray-200'}`}>
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
                    <div>
                      <span className="font-mono text-xs text-gray-400">#USL-{String(p.id).padStart(4,'0')}</span>
                      <h3 className="font-bold text-gray-900 mt-0.5">{p.judul}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.activity_type?.nama} · {new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Anggaran Disetujui</p>
                        <p className="font-mono font-extrabold text-muh-green text-lg">Rp {total.toLocaleString('id-ID')}</p>
                      </div>
                      {hasLpj ? (
                        <button onClick={() => setViewLpj(p)} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg font-bold text-sm hover:bg-green-100">
                          👁 Lihat LPJ
                        </button>
                      ) : (
                        <button onClick={() => { setSelected(isSelected ? null : p); setRingkasan(''); setRealisasi(''); }}
                          className={`px-3 py-2 rounded-lg font-bold text-sm transition ${isSelected ? 'bg-gray-100 text-gray-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'}`}>
                          {isSelected ? '↑ Tutup' : '+ Buat LPJ'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RAB Details (always visible) */}
                  <div className="px-5 pb-3 pt-2">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Rincian Anggaran (RAB)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2 text-left">No</th><th className="px-3 py-2 text-left">Deskripsi</th><th className="px-3 py-2 text-right">Nominal</th></tr></thead>
                        <tbody className="divide-y">
                          {p.details?.map((d: any, i: number) => (
                            <tr key={d.id} className="hover:bg-gray-50">
                              <td className="px-3 py-1.5 text-gray-400">{i+1}</td>
                              <td className="px-3 py-1.5">{d.deskripsi}</td>
                              <td className="px-3 py-1.5 text-right font-mono">Rp {Number(d.nominal).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* LPJ Form inline */}
                  {isSelected && !hasLpj && (
                    <div className="px-5 pb-5 pt-3 border-t border-blue-100 bg-blue-50">
                      <p className="text-sm font-bold text-blue-900 mb-3">Form Laporan Pertanggungjawaban</p>
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-blue-800 mb-1">Ringkasan Kegiatan & Hasil *</label>
                          <textarea required value={ringkasan} onChange={e => setRingkasan(e.target.value)} rows={3}
                            className="w-full border border-blue-200 rounded-lg p-3 text-sm bg-white" placeholder="Ceritakan jalannya acara, capaian, dan hambatan..."></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-800 mb-1">Total Dana Terealisasi (Rp) *</label>
                          <input required type="number" value={realisasi} onChange={e => setRealisasi(e.target.value)}
                            className="w-full border border-blue-200 rounded-lg p-3 text-sm bg-white font-mono" placeholder="0" />
                          {realisasi && <p className={`text-xs mt-1 font-semibold ${total - Number(realisasi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Selisih: Rp {(total - Number(realisasi)).toLocaleString('id-ID')} {total - Number(realisasi) >= 0 ? '(Sisa)' : '(Lebih)'}
                          </p>}
                        </div>
                        <button type="submit" disabled={submitting}
                          className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition">
                          {submitting ? 'Mengumpulkan...' : '📤 Submit Laporan LPJ'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
