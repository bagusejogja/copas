"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MiniEditor from '@/components/MiniEditor';

function FormProposal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProkerId = searchParams.get('proker_id') || '';
  
  const [activities, setActivities] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [prokers, setProkers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [judul, setJudul] = useState('');
  const [activityId, setActivityId] = useState('');
  const [prokerId, setProkerId] = useState(initialProkerId);
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

  const [details, setDetails] = useState([{ expense_reference_id: '', account_id: '', deskripsi: '', nominal: '' }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const res = await fetch('/api/proposals/references');
        const data = await res.json();
        setActivities(data.activities);
        setExpenses(data.expenses);
        setAccounts(data.accounts);
        setProkers(data.prokers || []);
        setUser(data.user);
        
        if (initialProkerId) {
          const selected = data.prokers.find((p: any) => p.id === Number(initialProkerId));
          if (selected) {
            setJudul(selected.nama_kegiatan);
            setLatar(selected.uraian_kegiatan || '');
            setTujuan(selected.tujuan || '');
            setKerjasama(selected.lembaga_mitra || '');
            if (selected.tanggal_mulai) setTglMulai(selected.tanggal_mulai.slice(0,10));
            if (selected.tanggal_selesai) setTglSelesai(selected.tanggal_selesai.slice(0,10));
          }
        }
      } finally {
        setFetching(false);
      }
    };
    fetchReferences();
  }, [initialProkerId]);

  const handleProkerChange = (id: string) => {
    setProkerId(id);
    if (id) {
       const selected = prokers.find(p => p.id === Number(id));
       if (selected) {
          setJudul(selected.nama_kegiatan);
          setLatar(selected.uraian_kegiatan || '');
          setTujuan(selected.tujuan || '');
          setKerjasama(selected.lembaga_mitra || '');
          if (selected.tanggal_mulai) setTglMulai(selected.tanggal_mulai.slice(0,10));
          if (selected.tanggal_selesai) setTglSelesai(selected.tanggal_selesai.slice(0,10));
       }
    }
  };

  const handleAddDetailRow = () => {
    setDetails([...details, { expense_reference_id: '', account_id: '', deskripsi: '', nominal: '' }]);
  };

  const handleRemoveDetailRow = (index: number) => {
    if (details.length > 1) {
      const newDetails = [...details];
      newDetails.splice(index, 1);
      setDetails(newDetails);
    }
  };

  const handleDetailChange = (index: number, field: string, value: string) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    setDetails(newDetails);
  };

  const calculateTotal = () => {
    return details.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
  };

  const selectedProker = prokers.find(p => p.id === Number(prokerId));

  const onSave = async (status: 'PENDING' | 'DRAFT') => {
    if (!user) { alert("User belum termuat..."); return; }
    
    // Minimal validation for draft
    if (!judul || !activityId) {
      alert("Minimal Judul dan Jenis Kegiatan harus diisi!");
      return;
    }

    const totalRow = calculateTotal();
    if (status === 'PENDING' && selectedProker && totalRow > selectedProker.remaining_budget) {
       alert(`Total RAB (Rp ${totalRow.toLocaleString()}) melebihi sisa anggaran Proker (Rp ${selectedProker.remaining_budget.toLocaleString()})`);
       return;
    }

    setLoading(true);
    try {
      const payload = {
        judul,
        activity_type_id: activityId,
        proker_id: prokerId,
        unit_id: user.unit.id,
        pemohon_id: user.id,
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
        details,
        status_terakhir: status
      };

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(status === 'DRAFT' ? 'Draf berhasil disimpan!' : 'Usulan berhasil diajukan!');
        router.push('/dashboard/proposals');
      } else {
        const errorData = await res.json();
        alert('Gagal: ' + errorData.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-gray-500 font-medium animate-pulse">Memuat form pengajuan...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
           <Link href="/dashboard/proposals" className="text-sm text-muh-green font-bold mb-2 inline-block hover:underline">← Kembali ke Daftar</Link>
           <h1 className="text-2xl font-extrabold text-gray-900">Form Pengajuan Usulan Anggaran</h1>
           <p className="mt-1 text-gray-500 text-sm font-medium">Unit: <span className="text-gray-900">{user?.unit?.nama}</span> | Pemohon: <span className="text-gray-900">{user?.nama}</span></p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status Pengajuan</p>
           <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-xs font-bold text-gray-600">DRAFT / PROSES</span>
           </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave('PENDING'); }} className="space-y-8">
        {/* Visualisasi Alur Approval */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-around text-[10px] font-black uppercase tracking-wider text-gray-400">
           <div className="flex flex-col items-center gap-2 text-muh-green">
              <div className="w-8 h-8 rounded-full border-2 border-muh-green flex items-center justify-center bg-muh-green/10 text-muh-green">1</div>
              <span>Input</span>
           </div>
           <div className="h-0.5 flex-1 bg-gray-100 mx-4"></div>
           <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center">2</div>
              <span>Atasan Unit</span>
           </div>
           <div className="h-0.5 flex-1 bg-gray-100 mx-4"></div>
           <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center">3</div>
              <span>Pusat / Pimpinan</span>
           </div>
           <div className="h-0.5 flex-1 bg-gray-100 mx-4"></div>
           <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center">4</div>
              <span>Cair / Selesai</span>
           </div>
        </div>

        {/* Proker Link */}
        <div className="bg-muh-green/5 p-6 rounded-xl border-2 border-muh-green/20 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
              <div className="bg-muh-green text-white p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Hubungkan ke Program Kerja Tahunan</h2>
                <p className="text-xs text-gray-500 font-medium">Pilih Proker yang sudah Anda rencanakan untuk mengambil data & sisa anggaran.</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Program Kerja (Proker)</label>
                <select 
                  value={prokerId} 
                  onChange={e => handleProkerChange(e.target.value)}
                  className="w-full border-2 border-muh-green/30 rounded-xl p-3 focus:ring-muh-green focus:border-muh-green bg-white font-medium shadow-sm transition-all"
                >
                  <option value="">-- [USULAN DI LUAR PROKER TAHUNAN] --</option>
                  {prokers.map(p => (
                    <option key={p.id} value={p.id} disabled={p.remaining_budget <= 0}>
                       {p.nama_kegiatan} ({p.periode_tahun}) - Sisa: Rp {p.remaining_budget.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProker && (
                <div className="bg-white p-4 rounded-xl border border-muh-green/20 shadow-inner">
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Status Anggaran Proker</p>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">Sisa Anggaran:</span>
                      <span className={`text-xl font-black ${selectedProker.remaining_budget > 0 ? 'text-muh-green' : 'text-red-500'}`}>
                         Rp {selectedProker.remaining_budget.toLocaleString('id-ID')}
                      </span>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Header Proposal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">1</span>
              Informasi Umum Kegiatan
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul Program Kerja / Kegiatan <span className="text-red-500">*</span></label>
                <input required type="text" value={judul} onChange={e => setJudul(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-muh-green transition-all" placeholder="Contoh: Rapat Koordinasi Tahunan 2026"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kegiatan <span className="text-red-500">*</span></label>
                <select required value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green bg-white font-medium">
                  <option value="">-- Pilih Jenis Kegiatan --</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tempat / Lokasi Kegiatan <span className="text-red-500">*</span></label>
                <input required type="text" value={tempat} onChange={e => setTempat(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" placeholder="Misal: Aula Lantai 2, Hotel Santika, dsb"/>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input required type="date" value={tglMulai} onChange={e => setTglMulai(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Selesai <span className="text-red-500">*</span></label>
                <input required type="date" value={tglSelesai} onChange={e => setTglSelesai(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium"/>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Latar Belakang & Rasionalitas</label>
                <textarea value={latar} onChange={e => setLatar(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" rows={4} placeholder="Jelaskan alasan pengadaan program kerja ini..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tujuan & Sasaran Kegiatan</label>
                <textarea value={tujuan} onChange={e => setTujuan(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" rows={3}></textarea>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bentuk Kegiatan</label>
                <input type="text" value={bentuk} onChange={e => setBentuk(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" placeholder="Misal: Seminar luring, Workshop, Pelatihan"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Peserta (Orang)</label>
                <input type="number" value={peserta} onChange={e => setPeserta(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" placeholder="0"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kerjasama Pihak Lain / Mitra</label>
                <input type="text" value={kerjasama} onChange={e => setKerjasama(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-muh-green font-medium" placeholder="(Opsional)"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Susunan Panitia</label>
                <MiniEditor value={panitia} onChange={setPanitia} placeholder="Ketik susunan kepanitiaan, gunakan toolbar untuk daftar bernomor..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Kebutuhan Peralatan / Sarana</label>
                <MiniEditor value={peralatan} onChange={setPeralatan} placeholder="Ketik kebutuhan alat/sarana kegiatan..." />
              </div>
           </div>
        </div>

        {/* Detail Proposal (RAB) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">2</span>
                Rencana Anggaran Biaya (RAB)
              </h2>
              <button 
                type="button" 
                onClick={handleAddDetailRow}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                 Tambah Baris RAB
              </button>
           </div>
           
           <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-4 py-4 rounded-tl-xl w-60">Referensi Pengeluaran</th>
                    <th className="px-4 py-4 w-60">Kode Akun</th>
                    <th className="px-4 py-4">Deskripsi / Rincian</th>
                    <th className="px-4 py-4 w-48 text-right">Nominal (Rp)</th>
                    <th className="px-4 py-4 w-16 text-center rounded-tr-xl"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.map((row, i) => (
                    <tr key={i} className="group transition hover:bg-gray-50/80">
                       <td className="px-2 py-4">
                         <select required value={row.expense_reference_id} onChange={e => handleDetailChange(i, 'expense_reference_id', e.target.value)} className="w-full text-sm border-gray-200 rounded-lg p-3 font-medium focus:ring-muh-green">
                           <option value="">-- Pilih Referensi --</option>
                           {expenses.map(exp => <option key={exp.id} value={exp.id}>{exp.nama}</option>)}
                         </select>
                       </td>
                       <td className="px-2 py-4">
                         <select required value={row.account_id} onChange={e => handleDetailChange(i, 'account_id', e.target.value)} className="w-full text-sm border-gray-200 rounded-lg p-3 font-medium focus:ring-muh-green">
                           <option value="">-- Pilih Akun --</option>
                           {accounts.map(acc => <option key={acc.id} value={acc.id}>[{acc.nomor}] {acc.nama_akun}</option>)}
                         </select>
                       </td>
                       <td className="px-2 py-4">
                         <input required type="text" value={row.deskripsi} onChange={e => handleDetailChange(i, 'deskripsi', e.target.value)} placeholder="Misal: Konsumsi Peserta 50 Pax" className="w-full text-sm border-gray-200 rounded-lg p-3 font-medium focus:ring-muh-green" />
                       </td>
                       <td className="px-2 py-4">
                         <input required type="number" min="0" value={row.nominal} onChange={e => handleDetailChange(i, 'nominal', e.target.value)} placeholder="0" className="w-full text-sm border-gray-200 rounded-lg p-3 text-right font-black text-gray-900 focus:ring-muh-green" />
                       </td>
                       <td className="px-2 py-4 text-center">
                         <button type="button" onClick={() => handleRemoveDetailRow(i)} disabled={details.length === 1} className="text-gray-300 hover:text-red-500 p-2 transition">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
  
           <div className="flex justify-end mt-6 pt-6 border-t font-black">
              <div className="text-right">
                 <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Total Estimasi Anggaran</p>
                 <div className="flex items-center gap-4">
                   {selectedProker && calculateTotal() > selectedProker.remaining_budget && (
                     <span className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-bounce">MELEBIHI SISA ANGGARAN PROKER!</span>
                   )}
                   <p className="text-4xl text-gray-900">
                      <span className="text-xl mr-1 italic text-gray-400">Rp</span>
                      {calculateTotal().toLocaleString('id-ID')}
                   </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Submit */}
        <div className="flex justify-between items-center pt-6 pb-20 border-t mt-8">
            <p className="text-sm text-gray-400 font-medium w-64 line-clamp-2">* Lampiran foto/dokumen bisa ditambahkan setelah draf disimpan.</p>
            <div className="flex gap-4">
               <button 
                 type="button"
                 disabled={loading}
                 onClick={() => onSave('DRAFT')}
                 className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition flex items-center gap-2 border border-gray-200"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                 Simpan Draf
               </button>
               <button 
                 type="button" 
                 disabled={loading || details.length === 0}
                 onClick={() => onSave('PENDING')}
                 className={`bg-muh-green hover:bg-muh-green-dark text-white text-xl px-12 py-4 rounded-2xl font-black shadow-xl shadow-muh-green/20 transition transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
               >
                 {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : '🚀'}
                 {loading ? 'Memproses...' : 'Kirim Usulan'}
               </button>
            </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateProposalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-medium animate-pulse">Memuat form...</div>}>
      <FormProposal />
    </Suspense>
  );
}
