"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

type DashData = {
  stats: { totalUsulan: number; pendingUsulan: number; approvedFinal: number; totalUsers: number };
  unitSummary: { id: number; nama_unit: string; diajukan: number; disetujui: number; totalAnggaran: number; totalDisetujui: number; totalSPJ: number }[];
  prokerSummary: { id: number; nama_kegiatan: string; anggaran: number; diajukan: number; disetujui: number; diambil: number; dilaporkan: number; sisa: number }[];
  recentProposals: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Sistem Anggaran</h1>
        <p className="text-gray-500 mt-1">Selamat datang kembali. Berikut adalah ringkasan aktivitas hari ini.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Usulan</p>
              <p className="text-4xl font-black mt-2">{data?.stats.totalUsulan ?? 0}</p>
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
              <p className="text-4xl font-black mt-2">{data?.stats.pendingUsulan ?? 0}</p>
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
              <p className="text-4xl font-black mt-2">{data?.stats.approvedFinal ?? 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <Link href="/dashboard/pertanggungjawaban" className="mt-3 block text-green-100 text-xs hover:text-white">Buat LPJ →</Link>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Pengguna</p>
              <p className="text-4xl font-black mt-2">{data?.stats.totalUsers ?? 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
          </div>
          <Link href="/dashboard/users" className="mt-3 block text-purple-100 text-xs hover:text-white">Kelola pengguna →</Link>
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
                    <th className="px-4 py-3 text-center">Diajukan</th>
                    <th className="px-4 py-3 text-center">Disetujui</th>
                    <th className="px-4 py-3 text-right">Total Diajukan (Rp)</th>
                    <th className="px-4 py-3 text-right">Total Disetujui (Rp)</th>
                    <th className="px-4 py-3 text-right">Total SPJ (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.unitSummary.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{u.nama_unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{u.diajukan}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{u.disetujui}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                        Rp {u.totalAnggaran.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-muh-green">
                        Rp {u.totalDisetujui.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-blue-600">
                        Rp {(u.totalSPJ || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
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
