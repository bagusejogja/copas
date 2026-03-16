"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

function EditForm() {
  const router = useRouter();
  const { id } = useParams();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [prokers, setProkers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [judul, setJudul] = useState('');
  const [activityId, setActivityId] = useState('');
  const [prokerId, setProkerId] = useState('');
  const [latar, setLatar] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [bentuk, setBentuk] = useState('');
  const [peserta, setPeserta] = useState('');
  const [kerjasama, setKerjasama] = useState('');
  const [peralatan, setPeralatan] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [tempat, setTempat] = useState('');
  const [panitia, setPanitia] = useState('');

  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setFetching(true);
        console.log("Edit page fetching proposal ID:", id);
        
        const [refRes, propRes] = await Promise.all([
          fetch('/api/proposals/references'),
          fetch(`/api/proposals/${id}`)
        ]);
        
        const refData = await refRes.json();
        const propData = await propRes.json();

        if (propData.message) {
           setError(propData.message);
           return;
        }

        setActivities(refData.activities || []);
        setExpenses(refData.expenses || []);
        setAccounts(refData.accounts || []);
        setProkers(refData.prokers || []);
        setUser(refData.user);

        // Fill form with fallback
        setJudul(propData.judul || '');
        setActivityId(propData.activity_type_id ? String(propData.activity_type_id) : '');
        setProkerId(propData.proker_id ? String(propData.proker_id) : '');
        setLatar(propData.latar_belakang || '');
        setTujuan(propData.tujuan || '');
        setBentuk(propData.bentuk_kegiatan || '');
        setPeserta(propData.jumlah_peserta ? String(propData.jumlah_peserta) : '');
        setKerjasama(propData.kerjasama || '');
        setPeralatan(propData.peralatan || '');
        if (propData.tanggal_mulai) setTglMulai(propData.tanggal_mulai.slice(0, 10));
        if (propData.tanggal_selesai) setTglSelesai(propData.tanggal_selesai.slice(0, 10));
        setTempat(propData.tempat || '');
        setPanitia(propData.susunan_panitia || '');
        
        if (propData.details && Array.isArray(propData.details)) {
          setDetails(propData.details.map((d: any) => ({
            expense_reference_id: String(d.expense_reference_id),
            account_id: String(d.account_id),
            deskripsi: d.deskripsi || '',
            nominal: String(d.nominal || 0)
          })));
        } else {
          setDetails([]);
        }

      } catch (err: any) {
        console.error("Fetch error in edit page:", err);
        setError("Gagal mengambil data: " + err.message);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddDetailRow = () => {
    setDetails([...details, { expense_reference_id: '', account_id: '', deskripsi: '', nominal: '0' }]);
  };

  const handleRemoveDetailRow = (index: number) => {
    const newDetails = [...details];
    newDetails.splice(index, 1);
    setDetails(newDetails);
  };

  const handleDetailChange = (index: number, field: string, value: string) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    setDetails(newDetails);
  };

  const onSave = async (status: 'PENDING' | 'DRAFT') => {
    setLoading(true);
    try {
      const payload = {
        judul,
        activity_type_id: activityId,
        proker_id: prokerId,
        latar_belakang: latar,
        tujuan,
        bentuk_kegiatan: bentuk,
        jumlah_peserta: peserta,
        kerjasama,
        peralatan,
        tanggal_mulai: tglMulai,
        tanggal_selesai: tglSelesai,
        tempat,
        susunan_panitia: panitia,
        details: details.map(d => ({
          ...d,
          nominal: Number(d.nominal)
        })),
        status_terakhir: status
      };

      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(status === 'DRAFT' ? 'Berhasil disimpan ke Draf!' : 'Usulan berhasil diajukan kembali!');
        router.push('/dashboard/proposals');
      } else {
        const err = await res.json();
        alert('Gagal: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center text-muh-green font-bold animate-pulse">Memuat data revisi...</div>;
  if (error) return (
    <div className="p-12 text-center">
      <p className="text-red-500 font-bold mb-4">Error: {error}</p>
      <Link href="/dashboard/proposals" className="text-blue-600 underline">Kembali ke Daftar</Link>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
           <Link href="/dashboard/proposals" className="text-sm text-gray-400 hover:text-muh-green font-bold mb-2 inline-block transition">← Batal & Kembali</Link>
           <h1 className="text-2xl font-extrabold text-gray-900">Form Revisi Usulan</h1>
           <p className="mt-1 text-orange-600 text-sm font-semibold">Silakan perbaiki data sesuai arahan atasan dan ajukan kembali.</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave('PENDING'); }} className="space-y-8 pb-20">
         {/* KEPALA USULAN */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-muh-green w-2 h-6 rounded-full"></span>
              Informasi Utama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Judul Usulan</label>
                <input required type="text" value={judul} onChange={e => setJudul(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:ring-muh-green focus:border-muh-green text-lg" placeholder="Contoh: Pengadaan Fasilitas Kantor Unit X" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Kegiatan</label>
                <select required value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <option value="">-- Pilih Jenis --</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Program Kerja Terkait</label>
                <select value={prokerId} onChange={e => setProkerId(e.target.value)} className="w-full border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <option value="">-- Tanpa Proker --</option>
                  {prokers.map(p => <option key={p.id} value={p.id}>{p.nama_kegiatan} (Sisa: Rp {p.remaining_budget?.toLocaleString()})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tempat Pelaksanaan</label>
                <input required type="text" value={tempat} onChange={e => setTempat(e.target.value)} className="w-full border-gray-200 rounded-xl p-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tgl Mulai</label>
                    <input required type="date" value={tglMulai} onChange={e => setTglMulai(e.target.value)} className="w-full border-gray-200 rounded-xl p-3" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tgl Selesai</label>
                    <input required type="date" value={tglSelesai} onChange={e => setTglSelesai(e.target.value)} className="w-full border-gray-200 rounded-xl p-3" />
                 </div>
              </div>
            </div>
         </div>

         {/* Rincian RAB */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-600 w-2 h-6 rounded-full"></span>
                Rincian Anggaran (RAB)
              </h2>
              <button type="button" onClick={handleAddDetailRow} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition">+ Baris</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-gray-400 border-b">
                    <th className="py-2 text-left">Referensi Biaya</th>
                    <th className="py-2 text-left">Kode Akun</th>
                    <th className="py-2 text-left">Deskripsi / Item</th>
                    <th className="py-2 text-right">Nominal</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {details.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">Belum ada rincian RAB. Klik tambah baris.</td></tr>
                  ) : details.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-2">
                        <select required value={row.expense_reference_id} onChange={e => handleDetailChange(i, 'expense_reference_id', e.target.value)} className="w-full border-gray-200 rounded-lg text-xs">
                          <option value="">-- Ref --</option>
                          {expenses.map(ex => <option key={ex.id} value={ex.id}>{ex.nama}</option>)}
                        </select>
                      </td>
                      <td className="py-3 pr-2">
                        <select required value={row.account_id} onChange={e => handleDetailChange(i, 'account_id', e.target.value)} className="w-full border-gray-200 rounded-lg text-xs">
                          <option value="">-- Akun --</option>
                          {accounts.map(ac => <option key={ac.id} value={ac.id}>{ac.nama_akun}</option>)}
                        </select>
                      </td>
                      <td className="py-3 pr-2">
                        <input required type="text" value={row.deskripsi} onChange={e => handleDetailChange(i, 'deskripsi', e.target.value)} className="w-full border-gray-200 rounded-lg text-xs" placeholder="Misal: Snack 50 Box" />
                      </td>
                      <td className="py-3 w-32 pr-2">
                        <input required type="number" value={row.nominal} onChange={e => handleDetailChange(i, 'nominal', e.target.value)} className="w-full border-gray-200 rounded-lg text-xs text-right font-bold text-gray-800" />
                      </td>
                      <td className="py-3 text-center">
                        <button type="button" onClick={() => handleRemoveDetailRow(i)} className="text-red-300 hover:text-red-600 transition">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/50 font-bold border-t-2 border-gray-100">
                    <td colSpan={3} className="py-4 px-2 text-right text-gray-500 uppercase text-xs">Total Anggaran Revisi</td>
                    <td className="py-4 px-2 text-right text-muh-green text-lg">
                      Rp {details.reduce((sum, d) => sum + Number(d.nominal || 0), 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
         </div>

         {/* SUBMIT */}
         <div className="flex justify-end gap-4 mt-8 border-t pt-6">
            <Link href="/dashboard/proposals" className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition">Batal</Link>
            <button 
              type="button" 
              disabled={loading} 
              onClick={() => onSave('DRAFT')}
              className="px-8 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
            >
              Simpan ke Draf
            </button>
            <button 
              type="button" 
              disabled={loading} 
              onClick={() => onSave('PENDING')}
              className="bg-muh-green text-white px-10 py-3 rounded-xl font-bold shadow-xl hover:bg-muh-green-dark transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Memproses...
                 </>
              ) : '✓ Ajukan Kembali'}
            </button>
         </div>
      </form>
    </div>
  );
}

export default function EditProposalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400 font-bold italic animate-pulse">Menyiapkan form...</div>}>
      <EditForm />
    </Suspense>
  );
}
