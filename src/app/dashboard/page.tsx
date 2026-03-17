"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

type DashData = {
  stats: { 
    totalUsulan: number; 
    pendingUsulan: number; 
    approvedFinal: number; 
    paidUsulan: number;
    totalUsers: number;
    totalNominalDiajukan: number;
    totalNominalPending: number;
    totalNominalFinal: number;
    totalNominalPaid: number;
    totalAnggaranSetahun: number;
  };
  unitSummary: { id: number; nama_unit: string; diajukan: number; disetujui: number; totalAnggaran: number; totalDisetujui: number; totalSPJ: number }[];
  prokerSummary: { id: number; nama_kegiatan: string; anggaran: number; diajukan: number; disetujui: number; diambil: number; dilaporkan: number; sisa: number }[];
  recentProposals: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitsInfo, setUnitsInfo] = useState<any[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(setUser);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = unitFilter ? `/api/dashboard?unit_id=${unitFilter}` : '/api/dashboard';
    
    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/api/units').then(res => res.json())
    ])
      .then(([dash, units]) => {
        setData(dash);
        setUnitsInfo(units);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [unitFilter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED_LV1: 'bg-blue-100 text-blue-800',
      APPROVED_LV2: 'bg-indigo-100 text-indigo-800',
      APPROVED_FINAL: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'Menunggu',
      APPROVED_LV1: 'Disetujui Atasan',
      APPROVED_LV2: 'Review Pusat',
      APPROVED_FINAL: 'Cair/Final',
      REJECTED: 'Ditolak',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  const fmt = (n: number) => n.toLocaleString('id-ID');

  if (loading) return (
    <div className="p-10 flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg">Memuat Dashboard...</div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Greeting & Filter */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Sistem Anggaran</h1>
          <p className="text-gray-500 mt-1">Selamat datang kembali. Berikut adalah ringkasan aktivitas.</p>
        </div>
        
        {/* Filter Panel (For PDM / Admin) */}
        {(user?.role?.level === 99 || user?.unit?.id === 1) && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-muh-green">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Pilih Pantauan Unit:</label>
            <select 
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-black text-muh-green rounded-lg focus:ring-0 cursor-pointer"
            >
              <option value="">Semua Majelis (Gabungan)</option>
              {unitsInfo.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nama_unit || u.nama}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Usulan</p>
              <p className="text-4xl font-black mt-1">{data?.stats.totalUsulan ?? 0}</p>
              <p className="text-xs text-blue-100/80 font-mono mt-1">Rp {fmt(data?.stats.totalNominalDiajukan ?? 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
          </div>
          <Link href="/dashboard/proposals" className="mt-3 block text-blue-100 text-xs hover:text-white">Lihat semua →</Link>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Menunggu Persetujuan</p>
              <p className="text-4xl font-black mt-1">{data?.stats.pendingUsulan ?? 0}</p>
              <p className="text-xs text-yellow-100/80 font-mono mt-1">Rp {fmt(data?.stats.totalNominalPending ?? 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <Link href="/dashboard/approvals" className="mt-3 block text-yellow-100 text-xs hover:text-white">Proses sekarang →</Link>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm font-medium">Usulan Final / Cair</p>
              <p className="text-4xl font-black mt-1">{data?.stats.approvedFinal ?? 0}</p>
              <p className="text-xs text-green-100/80 font-mono mt-1">Rp {fmt(data?.stats.totalNominalFinal ?? 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <Link href="/dashboard/pertanggungjawaban" className="mt-3 block text-green-100 text-xs hover:text-white">Buat LPJ →</Link>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Sudah Dibayarkan</p>
              <p className="text-4xl font-black mt-1">{data?.stats.paidUsulan ?? 0}</p>
              <p className="text-xs text-indigo-100/80 font-mono mt-1">Rp {fmt(data?.stats.totalNominalPaid ?? 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 0 00-2-2H9a2 2 0 00-2 2v6a2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
          </div>
          <Link href="/dashboard/kas" className="mt-3 block text-indigo-100 text-xs hover:text-white">Buku Kas Rekap →</Link>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Realisasi Tahun Ini</p>
              <p className="text-2xl font-black text-muh-green mt-1">
                 {data?.stats.totalAnggaranSetahun ? ((data.stats.totalNominalPaid / data.stats.totalAnggaranSetahun) * 100).toFixed(1) : 0}%
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                 <div className="bg-muh-green h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (data?.stats.totalNominalPaid || 0) / (data?.stats.totalAnggaranSetahun || 1) * 100)}%` }}></div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">Pagu: Rp {fmt(data?.stats.totalAnggaranSetahun ?? 0)}</p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-muh-green rounded-full animate-pulse"></span>
                Realisasi Anggaran Terkonsolidasi
              </p>
              <h2 className="text-2xl font-black text-gray-900 mt-1">
                Rp {fmt(data?.stats.totalNominalFinal ?? 0)} 
                <span className="text-gray-300 text-lg font-normal mx-2">/</span>
                <span className="text-gray-400 text-lg font-normal">Rp {fmt(data?.stats.totalAnggaranSetahun ?? 0)}</span>
              </h2>
           </div>
           <div className="text-right bg-muh-green/5 px-4 py-2 rounded-xl border border-muh-green/10">
              <p className="text-[10px] font-bold text-muh-green uppercase">Sudah Terserap</p>
              <span className="text-3xl font-black text-muh-green">
                {((data?.stats.totalNominalFinal ?? 0) / (data?.stats.totalAnggaranSetahun ?? 1) * 100).toFixed(1)}%
              </span>
           </div>
        </div>
        
        <div className="relative w-full bg-gray-100 h-6 rounded-2xl overflow-hidden shadow-inner flex">
           {/* Progress Sudah Cair */}
           <div 
             className="bg-gradient-to-r from-muh-green to-emerald-500 h-full transition-all duration-1000 relative group" 
             style={{ width: `${Math.min(100, (data?.stats.totalNominalFinal ?? 0) / (data?.stats.totalAnggaranSetahun ?? 1) * 100)}%` }}
           >
              <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
           </div>
           {/* Progress Pending */}
           <div 
             className="bg-yellow-400/40 h-full border-l border-white/20 transition-all duration-1000" 
             style={{ width: `${Math.min(100, (data?.stats.totalNominalPending ?? 0) / (data?.stats.totalAnggaranSetahun ?? 1) * 100)}%` }}
           ></div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4 text-[10px] font-bold">
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gradient-to-br from-muh-green to-emerald-500 rounded-sm shadow-sm"></span> 
              <span className="text-gray-600 uppercase">SUDAH CAIR (FINAL) <span className="text-gray-400 ml-1">Rp {fmt(data?.stats.totalNominalFinal ?? 0)}</span></span>
           </div>
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400/40 rounded-sm shadow-sm"></span> 
              <span className="text-gray-600 uppercase">DALAM PROSES (PENDING) <span className="text-gray-400 ml-1">Rp {fmt(data?.stats.totalNominalPending ?? 0)}</span></span>
           </div>
           <div className="flex items-center gap-2 ml-auto">
              <span className="w-3 h-3 bg-gray-100 rounded-sm"></span> 
              <span className="text-gray-400 uppercase">SISA ANGGARAN <span className="text-gray-500 ml-1">Rp {fmt((data?.stats.totalAnggaranSetahun ?? 0) - (data?.stats.totalNominalFinal ?? 0))}</span></span>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Monitoring Proker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-800">Monitoring Program Kerja Tahunan</h2>
            <span className="text-xs text-gray-400">{data?.prokerSummary.length ?? 0} program</span>
          </div>
          <div className="overflow-x-auto">
            {!data?.prokerSummary.length ? (
              <p className="p-6 text-sm text-gray-500">Belum ada data Program Kerja Tahunan.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Nama Kegiatan</th>
                    <th className="px-4 py-3 text-right">Anggaran</th>
                    <th className="px-4 py-3 text-right text-gray-400">Pengajuan</th>
                    <th className="px-4 py-3 text-right text-muh-green">Disetujui</th>
                    <th className="px-4 py-3 text-right text-orange-600">Diambil</th>
                    <th className="px-4 py-3 text-right text-blue-600">Dilaporkan (SPJ)</th>
                    <th className="px-4 py-3 text-right font-black">Sisa Anggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.prokerSummary.map(pk => (
                    <tr key={pk.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{pk.nama_kegiatan}</td>
                      <td className="px-4 py-3 text-right font-mono">Rp {fmt(pk.anggaran)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400">Rp {fmt(pk.diajukan)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muh-green font-bold">Rp {fmt(pk.disetujui)}</td>
                      <td className="px-4 py-3 text-right font-mono text-orange-600 font-bold">Rp {fmt(pk.diambil)}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600 font-bold">Rp {fmt(pk.dilaporkan)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${pk.sisa < (pk.anggaran * 0.1) ? 'text-red-600' : 'text-muh-green'}`}>
                        Rp {fmt(pk.sisa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tabel rekap per Unit */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800">Rekap Anggaran Per Unit</h2>
            <span className="text-xs text-gray-400">{data?.unitSummary.length ?? 0} unit aktif</span>
          </div>
          <div className="overflow-x-auto">
            {!data?.unitSummary.length ? (
              <p className="p-6 text-sm text-gray-500">Belum ada data pengajuan dari unit manapun.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Unit / Majelis</th>
                    <th className="px-4 py-3 text-center">Usulan</th>
                    <th className="px-4 py-3 text-right">Pagu Tahun Ini (Rp)</th>
                    <th className="px-4 py-3 text-right">Realisasi (Rp)</th>
                    <th className="px-4 py-3 text-right">Total SPJ (Rp)</th>
                    <th className="px-4 py-3 text-center">Serapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.unitSummary.map((u: any) => {
                    const paguData = Array.isArray(unitsInfo) 
                      ? unitsInfo.find(ui => ui.id === u.id)?.paguRecords?.find((r: any) => r.tahun === new Date().getFullYear())
                      : null;
                    const paguNominal = paguData ? Number(paguData.nominal) : 0;
                    const pct = paguNominal > 0 ? (u.totalDisetujui / paguNominal) * 100 : 0;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{u.nama_unit}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{u.diajukan} Pengajuan</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                          {paguNominal > 0 ? fmt(paguNominal) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-muh-green">
                          {fmt(u.totalDisetujui)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-blue-600">
                          {fmt(u.totalSPJ || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-end">
                            <span className={`text-[10px] font-bold ${pct > 90 ? 'text-red-500' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
                            <div className="w-16 bg-gray-100 h-1 rounded-full overflow-hidden">
                              <div className={`h-full ${pct > 90 ? 'bg-red-500' : 'bg-muh-green'}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Aktivitas Usulan Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {!data?.recentProposals.length ? (
              <p className="p-6 text-sm text-gray-500">Belum ada aktivitas pengajuan.</p>
            ) : data?.recentProposals.map((p: any) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition">
                <div className="h-9 w-9 rounded-full bg-muh-green/10 flex items-center justify-center text-muh-green font-bold text-sm flex-shrink-0">
                   {p.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{p.judul}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.unit.nama_unit} · {new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(p.status_terakhir)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
