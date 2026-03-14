"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TAHUN_LIST = [2024, 2025, 2026, 2027, 2028];

const EMPTY_FORM = {
  nama_kegiatan: '', sifat_kegiatan: 'Pokok', uraian_kegiatan: '',
  lembaga_mitra: '', sasaran: '', tujuan: '', strategi: '', indikator: '',
  anggaran_setahun: '', tanggal_mulai: '', tanggal_selesai: '', periode_tahun: String(new Date().getFullYear())
};

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }

export default function ProkerPage() {
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahunFilter, setTahunFilter] = useState(String(new Date().getFullYear()));
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/proker?tahun=${tahunFilter}`);
    const d = await res.json();
    setProkerList(Array.isArray(d) ? d : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tahunFilter]);

  const handleChange = (e: any) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      nama_kegiatan: item.nama_kegiatan, sifat_kegiatan: item.sifat_kegiatan,
      uraian_kegiatan: item.uraian_kegiatan || '', lembaga_mitra: item.lembaga_mitra || '',
      sasaran: item.sasaran || '', tujuan: item.tujuan || '', strategi: item.strategi || '',
      indikator: item.indikator || '', anggaran_setahun: String(item.anggaran_setahun),
      tanggal_mulai: item.tanggal_mulai ? item.tanggal_mulai.slice(0, 10) : '',
      tanggal_selesai: item.tanggal_selesai ? item.tanggal_selesai.slice(0, 10) : '',
      periode_tahun: String(item.periode_tahun)
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = '/api/proker';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchData(); }
      else { const err = await res.json(); alert(err.message); }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus Program Kerja ini? Hanya bisa jika belum ada usulan terkait.')) return;
    await fetch('/api/proker', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  };

  const getProkerStats = (pk: any) => {
    const details = pk.proposals?.flatMap((p: any) => p.details) || [];
    const totalDiajukan = details.reduce((s: number, d: any) => s + Number(d.nominal), 0);
    
    const approvedProposals = pk.proposals?.filter((p: any) => p.status_terakhir === 'APPROVED_FINAL') || [];
    const totalDisetujui = approvedProposals.reduce((s: number, p: any) => 
      s + p.details.reduce((ss: number, d: any) => ss + Number(d.nominal), 0), 0
    );

    const totalDilaporkan = pk.proposals?.reduce((s: number, p: any) => 
      s + (p.pertanggungjawabans?.reduce((ss: number, lpj: any) => ss + Number(lpj.total_realisasi), 0) || 0), 0
    ) || 0;

    const anggaran = Number(pk.anggaran_setahun);
    const sisa = anggaran - totalDisetujui;
    const pct = anggaran > 0 ? Math.min(100, Math.round(totalDisetujui / anggaran * 100)) : 0;
    
    return { totalDisetujui, totalDiajukan, totalDilaporkan, sisa, pct, jumlahProposal: pk.proposals?.length || 0 };
  };

  return (
    <div className="p-6">
      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muh-green-dark text-white rounded-t-2xl sticky top-0">
              <h2 className="font-bold text-lg">{editId ? '✏ Edit Program Kerja' : '+ Input Program Kerja Tahunan'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Periode Tahun *</label>
                  <select required name="periode_tahun" value={form.periode_tahun} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white">
                    {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sifat Kegiatan *</label>
                  <select required name="sifat_kegiatan" value={form.sifat_kegiatan} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white">
                    <option value="Pokok">Pokok</option>
                    <option value="Bantu">Bantu</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Kegiatan *</label>
                <input required type="text" name="nama_kegiatan" value={form.nama_kegiatan} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Menyelenggarakan Kegiatan Pelatihan Kader" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Uraian Kegiatan</label>
                <textarea name="uraian_kegiatan" value={form.uraian_kegiatan} onChange={handleChange} rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Deskripsi singkat kegiatan..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lembaga Mitra / Kerjasama</label>
                  <input type="text" name="lembaga_mitra" value={form.lembaga_mitra} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Nama lembaga mitra (jika ada)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Anggaran Setahun (Rp) *</label>
                  <input required type="number" name="anggaran_setahun" value={form.anggaran_setahun} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sasaran Kegiatan</label>
                <textarea name="sasaran" value={form.sasaran} onChange={handleChange} rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Siapa yang menjadi sasaran..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tujuan Kegiatan</label>
                <textarea name="tujuan" value={form.tujuan} onChange={handleChange} rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Tujuan yang ingin dicapai..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Strategi Kegiatan</label>
                  <textarea name="strategi" value={form.strategi} onChange={handleChange} rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Strategi pelaksanaan..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Indikator Ketercapaian</label>
                  <textarea name="indikator" value={form.indikator} onChange={handleChange} rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Indikator pencapaian..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mulai Pelaksanaan</label>
                  <input type="date" name="tanggal_mulai" value={form.tanggal_mulai} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Selesai Pelaksanaan</label>
                  <input type="date" name="tanggal_selesai" value={form.tanggal_selesai} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-muh-green text-white font-bold py-2.5 rounded-lg hover:bg-muh-green-dark">
                  {submitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : '+ Simpan Program Kerja')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-800 text-white rounded-t-2xl sticky top-0">
              <h2 className="font-bold text-lg">{detailItem.nama_kegiatan}</h2>
              <button onClick={() => setDetailItem(null)} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const stats = getProkerStats(detailItem);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[['Periode','Tahun ' + detailItem.periode_tahun],['Unit',detailItem.unit?.nama_unit],
                        ['Sifat Kegiatan',detailItem.sifat_kegiatan],['Lembaga Mitra',detailItem.lembaga_mitra || '-'],
                        ['Tanggal Mulai', detailItem.tanggal_mulai ? new Date(detailItem.tanggal_mulai).toLocaleDateString('id-ID') : '-'],
                        ['Tanggal Selesai', detailItem.tanggal_selesai ? new Date(detailItem.tanggal_selesai).toLocaleDateString('id-ID') : '-']
                      ].map(([l,v]) => (
                        <div key={l}><p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">{l}</p><p className="text-sm font-medium">{v}</p></div>
                      ))}
                    </div>
                    <div className="bg-muh-green/5 border border-muh-green/20 rounded-xl p-4 space-y-3">
                      <p className="font-bold text-muh-green">Realisasi Anggaran</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${stats.pct >= 90 ? 'bg-red-500' : stats.pct >= 60 ? 'bg-yellow-500' : 'bg-muh-green'}`} style={{width:`${stats.pct}%`}}></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-xs text-gray-500">Anggaran</p><p className="font-mono font-bold text-sm">{fmt(Number(detailItem.anggaran_setahun))}</p></div>
                        <div><p className="text-xs text-gray-500">Telah Disetujui</p><p className="font-mono font-bold text-sm text-green-700">{fmt(stats.totalDisetujui)}</p></div>
                        <div><p className="text-xs text-gray-500">Sisa</p><p className={`font-mono font-bold text-sm ${stats.sisa < 0 ? 'text-red-600' : 'text-blue-700'}`}>{fmt(stats.sisa)}</p></div>
                      </div>
                    </div>
                    {detailItem.uraian_kegiatan && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Uraian Kegiatan</p><p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">{detailItem.uraian_kegiatan}</p></div>}
                    {detailItem.sasaran && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Sasaran</p><p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">{detailItem.sasaran}</p></div>}
                    {detailItem.tujuan && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Tujuan</p><p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">{detailItem.tujuan}</p></div>}
                    {detailItem.strategi && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Strategi</p><p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">{detailItem.strategi}</p></div>}
                    {detailItem.indikator && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Indikator Ketercapaian</p><p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">{detailItem.indikator}</p></div>}
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Usulan Anggaran Terkait ({stats.jumlahProposal})</p>
                      {stats.jumlahProposal === 0 ? <p className="text-sm text-gray-400">Belum ada usulan yang dikaitkan.</p> : (
                        <Link href="/dashboard/proposals" className="text-sm text-blue-600 hover:underline">Lihat daftar usulan →</Link>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="px-6 pb-4 flex justify-end gap-3">
              <button onClick={() => { setDetailItem(null); openEdit(detailItem); }} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-lg font-bold text-sm">✏ Edit</button>
              <button onClick={() => setDetailItem(null)} className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg font-bold">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Program Kerja Tahunan</h1>
          <p className="mt-1 text-gray-600 text-sm">Rencanakan dan monitor pelaksanaan program kerja unit selama satu tahun.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={tahunFilter} onChange={e => setTahunFilter(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm bg-white font-semibold">
            {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
            className="bg-muh-green text-white font-bold px-5 py-2 rounded-lg hover:bg-muh-green-dark shadow-md">
            + Tambah Program
          </button>
        </div>
      </div>

      {loading ? <div className="p-10 text-center text-gray-500">Memuat...</div> :
        prokerList.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border shadow-sm">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-bold text-gray-700">Belum ada Program Kerja untuk Tahun {tahunFilter}</p>
            <p className="text-gray-500 text-sm mt-1">Klik "+ Tambah Program" untuk memulai perencanaan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {prokerList.map(pk => {
              const stats = getProkerStats(pk);
              return (
                <div key={pk.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col ${pk.is_active ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pk.sifat_kegiatan === 'Pokok' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {pk.sifat_kegiatan}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{pk.periode_tahun}</span>
                      </div>
                      {!pk.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 leading-snug mb-1">{pk.nama_kegiatan}</h3>
                    <p className="text-xs text-gray-500 mb-3">{pk.unit?.nama_unit}</p>
                    {pk.tanggal_mulai && <p className="text-xs text-gray-500 mb-3">
                      📅 {new Date(pk.tanggal_mulai).toLocaleDateString('id-ID')} – {pk.tanggal_selesai ? new Date(pk.tanggal_selesai).toLocaleDateString('id-ID') : '?'}
                    </p>}
                    {/* Progress bar */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Terserap {stats.pct}%</span>
                        <span>{stats.jumlahProposal} usulan</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${stats.pct >= 90 ? 'bg-red-500' : stats.pct >= 60 ? 'bg-yellow-500' : 'bg-muh-green'}`} style={{width:`${stats.pct}%`}}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                       <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center">
                          <p className="text-gray-400 uppercase font-bold">Anggaran</p>
                          <p className="font-mono font-black text-gray-700">{fmt(Number(pk.anggaran_setahun))}</p>
                       </div>
                       <div className="bg-muh-green/5 rounded-lg p-2 flex flex-col items-center">
                          <p className="text-muh-green uppercase font-bold">Disetujui</p>
                          <p className="font-mono font-black text-muh-green">{fmt(stats.totalDisetujui)}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                      <div className="bg-gray-50 rounded-md p-1.5 text-center">
                         <p className="text-gray-400">Pengajuan</p>
                         <p className="font-mono font-bold text-gray-500">{fmt(stats.totalDiajukan)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-md p-1.5 text-center">
                         <p className="text-blue-400">Dilaporkan</p>
                         <p className="font-mono font-bold text-blue-600">{fmt(stats.totalDilaporkan)}</p>
                      </div>
                      <div className={`rounded-md p-1.5 text-center ${stats.sisa < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                         <p className={stats.sisa < 0 ? 'text-red-400' : 'text-gray-400'}>Sisa</p>
                         <p className={`font-mono font-bold ${stats.sisa < 0 ? 'text-red-600' : 'text-gray-700'}`}>{fmt(stats.sisa)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t bg-gray-50 flex flex-wrap gap-2">
                    <button onClick={() => setDetailItem(pk)} className="flex-1 min-w-[80px] text-[10px] font-bold text-blue-700 border border-blue-200 bg-blue-50 px-2 py-1.5 rounded-lg hover:bg-blue-100">👁 Detail</button>
                    <button onClick={() => openEdit(pk)} className="flex-1 min-w-[80px] text-[10px] font-bold text-yellow-700 border border-yellow-200 bg-yellow-50 px-2 py-1.5 rounded-lg hover:bg-yellow-100">✏ Edit</button>
                    <Link href={`/dashboard/proposals/create?proker_id=${pk.id}`} className="flex-1 min-w-[100px] text-[10px] font-bold text-white bg-muh-green px-2 py-1.5 rounded-lg hover:bg-muh-green-dark text-center flex items-center justify-center">
                      📝 Buat Usulan
                    </Link>
                    <button onClick={() => handleDelete(pk.id)} className="flex-1 min-w-[80px] text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-1.5 rounded-lg hover:bg-red-100">🗑 Hapus</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
