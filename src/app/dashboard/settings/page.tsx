"use client";
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSet, resUnits] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/units')
      ]);
      const dataSet = await resSet.json();
      const dataUnits = await resUnits.json();
      setSettings(dataSet);
      setUnits(dataUnits);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSettings({ ...settings, [key]: value });
      } else {
        alert('Gagal menyimpan pengaturan');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="mt-1 text-gray-500 text-sm font-medium italic">Konfigurasi Periode & Parameter Global Aplikasi</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Period Setting Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gray-900 text-white flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📅</div>
            <div>
               <h3 className="font-bold">Periode Input Program Kerja</h3>
               <p className="text-xs text-white/50">Unit hanya bisa menambah/ubah proker pada rentang tanggal ini.</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex gap-3 mb-4">
               <button 
                 onClick={() => {
                   const start = new Date().toISOString().split('T')[0];
                   const end = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
                   saveSetting('proker_start_date', start);
                   saveSetting('proker_end_date', end);
                 }}
                 className="bg-muh-green text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-muh-green-dark"
               >
                 ✅ Buka Semua
               </button>
               <button 
                 onClick={() => {
                   saveSetting('proker_start_date', '');
                   saveSetting('proker_end_date', '');
                 }}
                 className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-700"
               >
                 🔒 Tutup Semua
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tanggal Mulai Buka (Global)</label>
                  <input 
                    type="date" 
                    value={settings.proker_start_date || ''} 
                    onChange={e => saveSetting('proker_start_date', e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-muh-green focus:bg-white rounded-2xl p-4 font-bold transition-all"
                  />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tanggal Tutup Akses (Global)</label>
                  <input 
                    type="date" 
                    value={settings.proker_end_date || ''} 
                    onChange={e => saveSetting('proker_end_date', e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl p-4 font-bold transition-all"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Custom Unit Access Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mt-8">
           <div className="p-6 bg-blue-900 text-white flex items-center gap-4">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🏢</div>
             <div>
                <h3 className="font-bold">Akses Khusus Per Unit (Custom)</h3>
                <p className="text-xs text-white/50">Gunakan jika ada salah satu unit yang perlu dibukakan akses khusus meskipun global ditutup.</p>
             </div>
           </div>
           <div className="p-8 overflow-x-auto">
              <table className="w-full text-sm">
                 <thead className="text-[10px] font-black uppercase text-gray-400 border-b">
                    <tr>
                       <th className="px-4 py-3 text-left">Nama Unit</th>
                       <th className="px-4 py-3 text-left">Custom Mulai</th>
                       <th className="px-4 py-3 text-left">Custom Akhir</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y">
                    {units.map(u => (
                       <tr key={u.id}>
                          <td className="px-4 py-3 font-bold text-gray-700">{u.nama_unit}</td>
                          <td className="px-4 py-3">
                             <input 
                               type="date" 
                               value={settings[`proker_start_date_${u.id}`] || ''} 
                               onChange={e => saveSetting(`proker_start_date_${u.id}`, e.target.value)}
                               className="text-xs p-2 border-gray-100 rounded bg-gray-50 focus:bg-white"
                             />
                          </td>
                          <td className="px-4 py-3">
                             <input 
                               type="date" 
                               value={settings[`proker_end_date_${u.id}`] || ''} 
                               onChange={e => saveSetting(`proker_end_date_${u.id}`, e.target.value)}
                               className="text-xs p-2 border-gray-100 rounded bg-gray-50 focus:bg-white"
                             />
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Info Box */}
        <div className="bg-muh-green/5 p-8 rounded-3xl border-2 border-dashed border-muh-green/20">
           <h4 className="font-bold text-muh-green">Cara Kerja Periode:</h4>
           <ul className="text-sm text-gray-600 mt-3 space-y-2 list-disc list-inside">
              <li>Jika tanggal hari ini berada **di luar** rentang di atas, unit kerja tidak akan bisa menekan tombol **"Tambah Program Kerja"**.</li>
              <li>Unit tetap bisa melihat (Read Only) data yang sudah ada.</li>
              <li>Administrator (Pusat) tetap memiliki akses penuh tanpa batasan waktu.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
