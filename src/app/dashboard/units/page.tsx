"use client";
import { useState, useEffect } from 'react';

type Unit = { id: number; nama_unit: string; parent_unit_id: number | null; parent_unit: { nama_unit: string } | null };

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  
  // form state
  const [namaUnit, setNamaUnit] = useState('');
  const [parentUnitId, setParentUnitId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    const res = await fetch('/api/units');
    const data = await res.json();
    setUnits(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           nama_unit: namaUnit, 
           parent_unit_id: parentUnitId || null 
        })
      });
      if (res.ok) {
        setNamaUnit('');
        setParentUnitId('');
        fetchUnits();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center border-b pb-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Data Unit Kerja / Majelis</h1>
           <p className="mt-1 text-gray-600 text-sm">Kelola struktur hierarki unit dalam organisasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Tambah Unit */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 h-fit">
           <h3 className="font-semibold text-lg text-gray-800 border-b pb-3 mb-4">Tambah Unit Baru</h3>
           <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Unit/Majelis <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  value={namaUnit}
                  onChange={e => setNamaUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-muh-green focus:border-muh-green text-sm"
                  placeholder="Contoh: Majelis Tabligh Kota"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Induk Unit (Opsional)</label>
                <select 
                  value={parentUnitId}
                  onChange={e => setParentUnitId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-muh-green focus:border-muh-green text-sm outline-none"
                >
                  <option value="">-- Tidak Ada Induk (Pusat / Teratas) --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.nama_unit}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Gunakan ini jika unit tersebut berada di bawah unit lain secara struktur.</p>
              </div>

              <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className={`w-full bg-muh-green text-white font-medium rounded-lg py-2.5 hover:bg-muh-green-dark transition flex justify-center items-center ${isSubmitting ? 'opacity-70' : ''}`}
                 >
                   {isSubmitting ? 'Menyimpan...' : 'Simpan Unit'}
                 </button>
              </div>
           </form>
        </div>

        {/* Tabel Daftar Unit */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden">
           {loading ? (
             <div className="p-8 text-center text-gray-500">Memuat data unit...</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-600">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                   <tr>
                     <th className="px-6 py-4 w-16 text-center">ID</th>
                     <th className="px-6 py-4">Nama Unit</th>
                     <th className="px-6 py-4">Induk (Parent Unit)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {units.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-4 text-center">Belum ada data unit.</td></tr>
                   ) : units.map(u => (
                     <tr key={u.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 text-center font-medium">{u.id}</td>
                       <td className="px-6 py-4 font-bold text-gray-800">{u.nama_unit}</td>
                       <td className="px-6 py-4">
                          {u.parent_unit ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {u.parent_unit.nama_unit}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Pusat / Teratas</span>
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
