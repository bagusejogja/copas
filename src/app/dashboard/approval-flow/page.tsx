"use client";
import { useState, useEffect } from 'react';
import Select from 'react-select';

type Flow = { id: number; urutan: number; label: string; is_active: boolean; role: { id: number; nama_jabatan: string; level: number } };
type Role = { id: number; nama_jabatan: string; level: number };

export default function ApprovalFlowPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState('');
  const [roleId, setRoleId] = useState('');
  const [urutan, setUrutan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/approval-flow');
    const d = await res.json();
    setFlows(d.flows || []);
    setRoles(d.roles || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/approval-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId, label, urutan })
      });
      if (res.ok) { setLabel(''); setRoleId(''); setUrutan(''); fetchData(); }
      else { const e = await res.json(); alert(e.message); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus langkah ini?')) return;
    await fetch('/api/approval-flow', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  };

  const handleToggle = async (flow: Flow) => {
    await fetch('/api/approval-flow', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: flow.id, is_active: !flow.is_active }) });
    fetchData();
  };

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Konfigurasi Alur Approval</h1>
        <p className="mt-1 text-gray-600 text-sm">Atur urutan jabatan yang harus menyetujui setiap pengajuan anggaran. Setiap langkah bisa diaktifkan/dinonaktifkan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Langkah */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-base text-gray-800 mb-4 border-b pb-2">+ Tambah Langkah Baru</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Langkah *</label>
              <input required type="number" min="1" value={urutan} onChange={e => setUrutan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="1, 2, 3..." />
              <p className="text-xs text-gray-500 mt-1">Langkah dengan urutan terkecil diproses lebih dulu.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label Langkah *</label>
              <input required type="text" value={label} onChange={e => setLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Contoh: Persetujuan Atasan Unit" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan Penyetuju *</label>
              {isMounted && (
                <Select
                  instanceId="approval-flow-role-select"
                  placeholder="Cari Jabatan..."
                  options={roles.map(r => ({ value: r.id, label: `${r.nama_jabatan} (Level ${r.level})` }))}
                  value={roleId ? { value: Number(roleId), label: roles.find(r => r.id === Number(roleId))?.nama_jabatan + ` (Level ${roles.find(r => r.id === Number(roleId))?.level})` } : null}
                  onChange={(val: any) => setRoleId(val ? String(val.value) : '')}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: '#d1d5db',
                      padding: '1px'
                    })
                  }}
                />
              )}
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-muh-green text-white font-bold py-2.5 rounded-lg hover:bg-muh-green-dark transition">
              {submitting ? 'Menyimpan...' : '+ Tambah Langkah'}
            </button>
          </form>
        </div>

        {/* Visualisasi Alur */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-base text-gray-800 mb-4 border-b pb-2">Alur Persetujuan Saat Ini</h3>
            {loading ? <p className="text-gray-500">Memuat...</p> :
              flows.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-4xl mb-2">⚙</p>
                  <p className="font-semibold">Belum ada alur yang dikonfigurasi.</p>
                  <p className="text-sm">Tambahkan langkah approval di panel kiri.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Starting node */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-xs">📄</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">Pengajuan Usulan (Penginput)</span>
                  </div>

                  {flows.map((flow, i) => (
                    <div key={flow.id}>
                      {/* Arrow */}
                      <div className="ml-5 h-6 w-0.5 bg-gray-300 relative">
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-400">▼</span>
                      </div>
                      {/* Step Card */}
                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${flow.is_active ? 'border-muh-green/30 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${flow.is_active ? 'bg-muh-green text-white' : 'bg-gray-300 text-gray-500'}`}>
                          {flow.urutan}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{flow.label}</p>
                          <p className="text-xs text-gray-500">Penyetuju: {flow.role.nama_jabatan} (Level {flow.role.level})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggle(flow)}
                            className={`text-xs font-bold px-3 py-1 rounded-full transition ${flow.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {flow.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button onClick={() => handleDelete(flow.id)}
                            className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition">
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Final node */}
                  <div className="ml-5 h-6 w-0.5 bg-gray-300 relative">
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-400">▼</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold text-xs">✅</span>
                    </div>
                    <span className="text-sm font-semibold text-green-700">Anggaran Disetujui Final → Siap Cair</span>
                  </div>
                </div>
              )
            }
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">ℹ Catatan Penting:</p>
            <p>Alur ini adalah <strong>konfigurasi referensi</strong>. Untuk mengubah logika approval yang sudah berjalan secara dinamis mengikuti alur ini diperlukan pengembangan lebih lanjut pada modul approval. Saat ini, alur approval berjalan berdasarkan level jabatan pengguna.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
