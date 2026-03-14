"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Proposal = {
  id: number;
  judul: string;
  status_terakhir: string;
  tanggal: string;
  unit: { nama_unit: string };
  pemohon: { nama: string };
  activity_type: { nama: string };
  details: { nominal: number }[];
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      if (Array.isArray(data)) {
         setProposals(data);
      } else {
         setProposals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Menunggu</span>;
    if (status === 'APPROVED_LV1') return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Disetujui Atasan</span>;
    if (status === 'APPROVED_FINAL') return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Disetujui Pimpinan</span>;
    if (status === 'REJECTED') return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Ditolak</span>;
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{status}</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center border-b pb-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Daftar Usulan Anggaran</h1>
           <p className="mt-1 text-gray-600 text-sm">Lihat status pengajuan program kerja dari unit Anda.</p>
        </div>
        <Link href="/dashboard/proposals/create" className="bg-muh-green hover:bg-muh-green-dark text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
           Buat Usulan Baru
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {loading ? (
             <div className="p-8 text-center text-gray-500">Memuat data usulan...</div>
         ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-600">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                   <tr>
                     <th className="px-6 py-4">ID & Tanggal</th>
                     <th className="px-6 py-4">Judul Program Kerja</th>
                     <th className="px-6 py-4">Pemohon & Unit</th>
                     <th className="px-6 py-4">Total Biaya</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-center">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {proposals.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-4 text-center">Belum ada usulan anggaran yang diajukan.</td></tr>
                   ) : proposals.map(p => {
                     // Calculate total sum
                     const total = p.details.reduce((sum, item) => sum + Number(item.nominal), 0);
                     
                     return (
                     <tr key={p.id} className="hover:bg-gray-50 transition">
                       <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-400">#USL-{p.id.toString().padStart(4, '0')}</span>
                          <div className="text-gray-900 font-medium mt-1">{new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{p.judul}</div>
                          <div className="text-xs text-muh-green font-medium mt-1">{p.activity_type.nama}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{p.pemohon.nama}</div>
                          <div className="text-xs text-gray-500 mt-1">{p.unit.nama_unit}</div>
                       </td>
                       <td className="px-6 py-4 font-bold text-gray-900">
                          Rp {total.toLocaleString('id-ID')}
                       </td>
                       <td className="px-6 py-4 text-center">
                          {getStatusBadge(p.status_terakhir)}
                       </td>
                       <td className="px-6 py-4 text-center">
                           <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Detail</button>
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             </div>
         )}
      </div>
    </div>
  );
}
