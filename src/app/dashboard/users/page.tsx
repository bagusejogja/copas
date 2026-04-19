"use client";
import { useState, useEffect } from 'react';
import Select from 'react-select';

type User = { 
  id: number; 
  nama: string; 
  nbm?: string; 
  username: string; 
  role: { id: number; nama_jabatan: string }; 
  unit: { id: number; nama_unit: string } 
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{id: number, nama_jabatan: string}[]>([]);
  const [units, setUnits] = useState<{id: number, nama_unit: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nama: '', nbm: '', username: '', password: '', role_id: '', unit_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', nbm: '', role_id: '', unit_id: '', password: '' });
  const [editing, setEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, rRes, unRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles'), fetch('/api/units')]);
      setUsers(await uRes.json());
      setRoles(await rRes.json());
      setUnits(await unRes.json());
    } finally { setLoading(false); }
  };

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setErrorMsg('');
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setForm({ nama: '', nbm: '', username: '', password: '', role_id: '', unit_id: '' }); fetchData(); }
      else setErrorMsg(data.message);
    } finally { setIsSubmitting(false); }
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ nama: u.nama, nbm: u.nbm || '', role_id: String(u.role.id), unit_id: String(u.unit.id), password: '' });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditing(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, ...editForm })
      });
      if (res.ok) { setEditUser(null); fetchData(); }
      else { const e = await res.json(); alert(e.message); }
    } finally { setEditing(false); }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus akun "${nama}"?`)) return;
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  };

  const roleOptions = roles.map(r => ({ value: String(r.id), label: r.nama_jabatan }));
  const unitOptions = units.map(u => ({ value: String(u.id), label: u.nama_unit }));

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>
        <p className="mt-1 text-gray-600 text-sm">Kelola akun dan hak otorisasi staf persyarikatan.</p>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-800 text-white rounded-t-2xl">
              <h2 className="font-bold text-lg">Edit Pengguna</h2>
              <button onClick={() => setEditUser(null)} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (tidak bisa diubah)</label>
                <input disabled value={editUser.username} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input required type="text" value={editForm.nama} onChange={e => setEditForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">NBM</label>
                   <input type="text" value={editForm.nbm} onChange={e => setEditForm(f => ({ ...f, nbm: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Opsional" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan (Role) *</label>
                {isMounted && (
                  <Select 
                    instanceId="edit-role-select"
                    placeholder="-- Ketik / Cari Jabatan --"
                    required
                    options={roleOptions} 
                    value={roleOptions.find(o => o.value === editForm.role_id) || null}
                    onChange={(val: any) => setEditForm(f => ({ ...f, role_id: val?.value || '' }))}
                    className="text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Majelis *</label>
                {isMounted && (
                   <Select 
                    instanceId="edit-unit-select"
                    placeholder="-- Ketik / Cari Unit --"
                    required
                    options={unitOptions} 
                    value={unitOptions.find(o => o.value === editForm.unit_id) || null}
                    onChange={(val: any) => setEditForm(f => ({ ...f, unit_id: val?.value || '' }))}
                    className="text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                  <span>Password Baru <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></span>
                  <button type="button" onClick={() => setEditForm(f => ({ ...f, password: '123' }))} className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold hover:bg-red-200">Set "123"</button>
                </label>
                <input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="●●●●" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={editing} className="flex-1 bg-blue-700 text-white font-bold py-2 rounded-lg hover:bg-blue-800">
                  {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-3 mb-4">Buat Akun Baru</h3>
          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{errorMsg}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" name="nama" value={form.nama} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">NBM</label>
                <input type="text" name="nbm" value={form.nbm} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Sbg Pegawai" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
              <input required type="text" name="username" value={form.username} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input required type="password" name="password" value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan <span className="text-red-500">*</span></label>
              {isMounted && (
                <Select 
                    instanceId="create-role-select"
                    placeholder="-- Ketik / Cari Jabatan --"
                    required
                    options={roleOptions} 
                    value={roleOptions.find(o => o.value === form.role_id) || null}
                    onChange={(val: any) => setForm({ ...form, role_id: val?.value || '' })}
                    className="text-sm"
                />
              )}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
             {isMounted && (
               <Select 
                  instanceId="create-unit-select"
                  placeholder="-- Ketik / Cari Unit --"
                  required
                  options={unitOptions} 
                  value={unitOptions.find(o => o.value === form.unit_id) || null}
                  onChange={(val: any) => setForm({ ...form, unit_id: val?.value || '' })}
                  className="text-sm"
                />
             )}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-muh-green text-white font-bold rounded-lg py-2.5 hover:bg-muh-green-dark transition">
              {isSubmitting ? 'Memproses...' : '+ Tambah Pengguna'}
            </button>
          </form>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-500">Memuat...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-4">Nama & Username / NBM</th>
                    <th className="px-5 py-4">Jabatan</th>
                    <th className="px-5 py-4">Unit</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Belum ada akun.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{u.nama}</p>
                        <p className="text-xs text-gray-400 mt-0.5">@{u.username} • {u.nbm ? `NBM: ${u.nbm}` : 'NBM: -'}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-blue-700">{u.role.nama_jabatan}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-muh-green border border-green-200">{u.unit.nama_unit}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEdit(u)} className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                          <button onClick={() => handleDelete(u.id, u.nama)} className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Hapus</button>
                        </div>
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
