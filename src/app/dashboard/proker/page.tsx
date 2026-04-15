"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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
  const [settings, setSettings] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportForm, setExportForm] = useState({ pembuat: '', jabatan_pembuat: '', atasan: '', jabatan_atasan: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPk, resSet, resMe] = await Promise.all([
        fetch(`/api/proker?tahun=${tahunFilter}`),
        fetch('/api/settings'),
        fetch('/api/auth/me')
      ]);
      const dPk = await resPk.json();
      const dSet = await resSet.json();
      const dMe = await resMe.json();
      
      setProkerList(Array.isArray(dPk) ? dPk : []);
      setSettings(dSet);
      setUser(dMe);
    } finally { setLoading(false); }
  };

  const isPeriodOpen = () => {
    if (!user || user.role?.level >= 99) return true;
    const now = new Date();
    
    // Check custom unit access first
    const customStart = settings[`proker_start_date_${user.unit?.id}`];
    const customEnd = settings[`proker_end_date_${user.unit?.id}`];
    
    if (customStart && customEnd) {
      if (new Date(customStart) <= now && new Date(customEnd) >= now) return true;
    }

    // Fallback to global access
    if (settings.proker_start_date && new Date(settings.proker_start_date) > now) return false;
    if (settings.proker_end_date && new Date(settings.proker_end_date) < now) return false;
    
    // If no setting, it's open by default or closed? (usually closed if restricted)
    if (!settings.proker_start_date && !settings.proker_end_date) return false;
    
    return true;
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

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const unitName = prokerList[0]?.unit?.nama_unit || user?.unit?.nama_unit || 'Unit';
    const title = `Daftar Program Kerja Tahunan ${tahunFilter} - ${unitName}`;
    
    const rows: any[][] = [
      [title],
      [],
      ['No', 'Nama Kegiatan', 'Sifat', 'Anggaran (Rp)', 'Uraian Kegiatan', 'Sasaran', 'Tujuan', 'Strategi', 'Indikator', 'Tgl Mulai', 'Tgl Selesai'],
    ];

    prokerList.forEach((pk: any, i: number) => {
      rows.push([
        i + 1,
        pk.nama_kegiatan,
        pk.sifat_kegiatan,
        Number(pk.anggaran_setahun),
        pk.uraian_kegiatan || '-',
        pk.sasaran || '-',
        pk.tujuan || '-',
        pk.strategi || '-',
        pk.indikator || '-',
        pk.tanggal_mulai ? new Date(pk.tanggal_mulai).toLocaleDateString('id-ID') : '-',
        pk.tanggal_selesai ? new Date(pk.tanggal_selesai).toLocaleDateString('id-ID') : '-',
      ]);
    });

    const totalAnggaran = prokerList.reduce((s: number, pk: any) => s + Number(pk.anggaran_setahun), 0);
    rows.push(['', 'TOTAL', '', totalAnggaran, '', '', '', '', '', '', '']);
    rows.push([]);
    rows.push([]);
    
    // Kolom TTD (4 kolom terakhir untuk 2 ttd berdampingan)
    const colA = 'A'; // empty
    rows.push(['', '', '', '', '', '', '', '', 'Yogyakarta, ' + new Date().toLocaleDateString('id-ID'), '', '']);
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', 'Pembuat,', '', 'Mengetahui,']);
    rows.push(['', '', '', '', '', '', '', '', exportForm.jabatan_pembuat || '...............', '', exportForm.jabatan_atasan || '...............']);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', `( ${exportForm.pembuat || '.....................'} )`, '', `( ${exportForm.atasan || '.....................'} )`]);
    rows.push(['', '', '', '', '', '', '', '', exportForm.jabatan_pembuat || '', '', exportForm.jabatan_atasan || '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Merge title row
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }
    ];
    ws['!cols'] = [
      { wch: 4 }, { wch: 35 }, { wch: 8 }, { wch: 18 }, { wch: 25 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Proker');
    XLSX.writeFile(wb, `Proker_${unitName.replace(/\s/g,'_')}_${tahunFilter}.xlsx`);
    setShowExport(false);
  };

  const getProkerStats = (pk: any) => {
    const proposals = pk.proposals || [];
    
    // 1. Pengajuan: Total nominal usulan yang aktif (bukan Draft/Rejected)
    const activeProposals = proposals.filter((p: any) => !['DRAFT', 'REJECTED'].includes(p.status_terakhir));
    const totalPengajuan = activeProposals.reduce((s: number, p: any) => 
      s + p.details.reduce((ss: number, d: any) => ss + Number(d.nominal), 0), 0
    );

    // 2. Disetujui: Sudah disetujui sampai tahap bendahara (APPROVED_FINAL or PAID)
    const approvedProposals = proposals.filter((p: any) => ['APPROVED_FINAL', 'PAID'].includes(p.status_terakhir));
    const totalDisetujui = approvedProposals.reduce((s: number, p: any) => 
      s + p.details.reduce((ss: number, d: any) => ss + Number(d.nominal), 0), 0
    );

    // 3. Diambil: Uang sudah cair (PAID)
    const takenProposals = proposals.filter((p: any) => p.status_terakhir === 'PAID');
    const totalDiambil = takenProposals.reduce((s: number, p: any) => 
      s + p.details.reduce((ss: number, d: any) => ss + Number(d.nominal), 0), 0
    );

    // 4. Dilaporkan (SPJ): Total realisasi dari SPJ (yang sudah disetujui bendahara)
    const totalDilaporkan = proposals.reduce((s: number, p: any) => 
      s + (p.pertanggungjawabans?.filter((lpj: any) => lpj.status === 'APPROVED_FINAL').reduce((ss: number, lpj: any) => ss + Number(lpj.total_realisasi), 0) || 0), 0
    ) || 0;

    const sisaDana = totalDiambil - totalDilaporkan; // Sisa yang belum dispjkan
    const anggaranPlan = Number(pk.anggaran_setahun);
    const pct = anggaranPlan > 0 ? Math.min(100, Math.round(totalDisetujui / anggaranPlan * 100)) : 0;

    const currentPaguRecord = pk.unit?.paguRecords?.find((r: any) => r.tahun === Number(tahunFilter));
    const paguUnit = currentPaguRecord ? Number(currentPaguRecord.nominal) : 0;

    return { 
      anggaranPlan, totalPengajuan, totalDisetujui, totalDiambil, totalDilaporkan, 
      sisaDana, pct, paguUnit, jumlahProposal: proposals.length 
    };
  };

  const getGlobalUnitStats = () => {
    // Total anggaran agreed for all prokers in this year
    const totalAnggaran = prokerList.reduce((sum, pk) => sum + Number(pk.anggaran_setahun), 0);
    
    // Get unit info from prokerList[0] (admin view) or user.unit (unit view)
    const unit = prokerList.length > 0 ? prokerList[0].unit : user?.unit;
    const currentPaguRecord = unit?.paguRecords?.find((r: any) => r.tahun === Number(tahunFilter));
    const paguUnit = currentPaguRecord ? Number(currentPaguRecord.nominal) : 0;
    
    const sisaPagu = paguUnit - totalAnggaran;
    const usagePct = paguUnit > 0 ? Math.min(100, Math.round((totalAnggaran / paguUnit) * 100)) : 0;

    return { totalAnggaran, paguUnit, sisaPagu, usagePct, unitName: unit?.nama_unit };
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
                        <div><p className="text-xs text-gray-500">Anggaran</p><p className="font-mono font-bold text-sm">{fmt(stats.anggaranPlan)}</p></div>
                        <div><p className="text-xs text-gray-500">Telah Disetujui</p><p className="font-mono font-bold text-sm text-green-700">{fmt(stats.totalDisetujui)}</p></div>
                        <div><p className="text-xs text-gray-500">Sisa Kas Unit</p><p className={`font-mono font-bold text-sm ${stats.sisaDana < 0 ? 'text-red-600' : 'text-blue-700'}`}>{fmt(stats.sisaDana)}</p></div>
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

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muh-green-dark text-white rounded-t-2xl">
              <h2 className="font-bold text-lg">📥 Download Format Excel</h2>
              <button onClick={() => setShowExport(false)} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Isikan nama penandatangan untuk dicantumkan di bagian bawah dokumen:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pembuat</label>
                  <input type="text" value={exportForm.pembuat} onChange={e => setExportForm(f => ({ ...f, pembuat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jabatan Pembuat</label>
                  <input type="text" value={exportForm.jabatan_pembuat} onChange={e => setExportForm(f => ({ ...f, jabatan_pembuat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Ketua Majelis" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Atasan / Mengetahui</label>
                  <input type="text" value={exportForm.atasan} onChange={e => setExportForm(f => ({ ...f, atasan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jabatan Atasan</label>
                  <input type="text" value={exportForm.jabatan_atasan} onChange={e => setExportForm(f => ({ ...f, jabatan_atasan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Ketua PDM" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExport(false)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="button" onClick={handleExportExcel} className="flex-1 bg-muh-green text-white font-bold py-2 rounded-lg hover:bg-muh-green-dark">📥 Download Excel</button>
              </div>
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
          {prokerList.length > 0 && (
            <button onClick={() => setShowExport(true)}
              className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md text-sm flex items-center gap-2">
              📥 Download Excel
            </button>
          )}
          {isPeriodOpen() && (
            <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
              className="bg-muh-green text-white font-bold px-5 py-2 rounded-lg hover:bg-muh-green-dark shadow-md">
              + Tambah Program
            </button>
          )}
          {!isPeriodOpen() && (
             <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black border border-red-100 italic">
                🔒 Periode Ditutup
             </div>
          )}
        </div>
      </div>

      {/* Unit Budget Summary */}
      {!loading && (user?.unit || prokerList.length > 0) && (() => {
        const gStats = getGlobalUnitStats();
        return (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">🏛️</div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pagu {tahunFilter}</p>
                   <p className="text-xl font-black text-gray-900">{fmt(gStats.paguUnit)}</p>
                   <p className="text-[9px] text-gray-400 font-bold truncate max-w-[150px]">{gStats.unitName}</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-muh-green/10 text-muh-green rounded-xl flex items-center justify-center text-xl">📊</div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digunakan Proker</p>
                   <p className="text-xl font-black text-muh-green">{fmt(gStats.totalAnggaran)}</p>
                   <div className="mt-2 w-32 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${gStats.usagePct >= 90 ? 'bg-red-500' : 'bg-muh-green'}`} style={{width: `${gStats.usagePct}%`}}></div>
                   </div>
                </div>
             </div>
             <div className={`p-6 rounded-2xl shadow-sm border-2 flex items-center gap-4 ${gStats.sisaPagu < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-900 border-gray-800 text-white'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${gStats.sisaPagu < 0 ? 'bg-red-100 text-red-600' : 'bg-white/10 text-white'}`}>💰</div>
                <div>
                   <p className={`text-[10px] font-black uppercase tracking-widest ${gStats.sisaPagu < 0 ? 'text-red-400' : 'text-white/50'}`}>Sisa Pagu Belum Terbagi</p>
                   <p className={`text-xl font-black ${gStats.sisaPagu < 0 ? 'text-red-700' : 'text-white'}`}>{fmt(gStats.sisaPagu)}</p>
                </div>
             </div>
          </div>
        );
      })()}

      {loading ? <div className="p-10 text-center text-gray-500">Memuat...</div> :
        prokerList.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border shadow-sm">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-bold text-gray-700">Belum ada Program Kerja untuk Tahun {tahunFilter}</p>
            <p className="text-gray-500 text-sm mt-1">Klik "+ Tambah Program" untuk memulai perencanaan.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 border-b-2 border-gray-100 text-[10px] uppercase font-black text-gray-400">
                      <tr>
                         <th className="px-6 py-4">Nama Program & Unit</th>
                         <th className="px-6 py-4 text-right">Anggaran</th>
                         <th className="px-6 py-4 text-right">Pengajuan</th>
                         <th className="px-6 py-4 text-right">Disetujui</th>
                         <th className="px-6 py-4 text-right">Diambil</th>
                         <th className="px-6 py-4 text-right">Dilaporkan (SPJ)</th>
                         <th className="px-6 py-4 text-right">Sisa Dana</th>
                         <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {prokerList.map(pk => {
                         const stats = getProkerStats(pk);
                         return (
                            <tr key={pk.id} className={`group hover:bg-gray-50/50 transition-all ${!pk.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                               <td className="px-6 py-4">
                                  <p className="font-bold text-gray-900 leading-tight">{pk.nama_kegiatan}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${pk.sifat_kegiatan === 'Pokok' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                       {pk.sifat_kegiatan}
                                     </span>
                                     <span className="text-[10px] text-gray-400 font-medium">{pk.unit?.nama_unit}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">
                                  {fmt(stats.anggaranPlan)}
                               </td>
                               <td className="px-6 py-4 text-right font-mono font-bold text-gray-400">
                                  {fmt(stats.totalPengajuan)}
                               </td>
                               <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">
                                  {fmt(stats.totalDisetujui)}
                               </td>
                               <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                  {fmt(stats.totalDiambil)}
                               </td>
                               <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                                  {fmt(stats.totalDilaporkan)}
                               </td>
                               <td className={`px-6 py-4 text-right font-mono font-bold ${stats.sisaDana < 0 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                                  {fmt(stats.sisaDana)}
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-1">
                                     <button onClick={() => setDetailItem(pk)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Detail">👁</button>
                                     {isPeriodOpen() && (
                                       <>
                                         <button onClick={() => openEdit(pk)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition" title="Edit">✏</button>
                                         <button onClick={() => handleDelete(pk.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">🗑</button>
                                       </>
                                     )}
                                     <Link href={`/dashboard/proposals/create?proker_id=${pk.id}`} className="p-2 text-muh-green hover:bg-muh-green/10 rounded-lg transition" title="Buat Usulan">📝</Link>
                                  </div>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )
      }
    </div>
  );
}
