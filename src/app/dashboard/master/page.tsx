"use client";
import { useState, useEffect } from 'react';

type Item = { id: number; nama?: string; nama_jabatan?: string; level?: number; nomor?: string; nama_akun?: string; unit_id?: number | null; is_active?: boolean; unit?: { nama_unit: string } };
type TabKey = 'expense' | 'activity' | 'account' | 'role';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'expense', label: 'Referensi Pengeluaran', icon: '💸' },
  { key: 'activity', label: 'Jenis Kegiatan', icon: '📋' },
  { key: 'account', label: 'Kode Akun', icon: '🏦' },
  { key: 'role', label: 'Nama Jabatan', icon: '👤' },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('expense');
  const [data, setData] = useState<Record<TabKey, Item[]>>({ expense: [], activity: [], account: [], role: [] });
  const [units, setUnits] = useState<{id: number, nama_unit: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<TabKey[]>(['expense', 'activity', 'account', 'role']);

  // Add form
  const [nama, setNama] = useState('');
  const [nomor, setNomor] = useState('');
  const [namaAkun, setNamaAkun] = useState('');
  const [level, setLevel] = useState('');
  const [unitId, setUnitId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit state
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNomor, setEditNomor] = useState('');
  const [editNamaAkun, setEditNamaAkun] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editUnitId, setEditUnitId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [masterRes, unitsRes] = await Promise.all([
        fetch('/api/master'),
        fetch('/api/units')
      ]);
      const d = await masterRes.json();
      const u = await unitsRes.json();
      setData({ expense: d.expenses, activity: d.activities, account: d.accounts, role: d.roles });
      setUnits(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
    const saved = localStorage.getItem('master_visible_tabs');
    if (saved) setVisibleTabs(JSON.parse(saved));
  }, []);

  const toggleTabVisibility = (key: TabKey) => {
    const newTabs = visibleTabs.includes(key) 
      ? visibleTabs.filter(t => t !== key) 
      : [...visibleTabs, key];
    setVisibleTabs(newTabs);
    localStorage.setItem('master_visible_tabs', JSON.stringify(newTabs));
    // If current tab is hidden, switch to first visible
    if (!newTabs.includes(activeTab)) {
      const first = TABS.find(t => newTabs.includes(t.key));
      if (first) setActiveTab(first.key);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErrorMsg('');
    try {
      const payload: any = { type: activeTab, unit_id: unitId ? Number(unitId) : null };
      if (activeTab === 'account') { payload.nomor = nomor; payload.nama_akun = namaAkun; }
      else if (activeTab === 'role') { payload.nama_jabatan = nama; payload.level = level; }
      else { payload.nama = nama; }
      const res = await fetch('/api/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setNama(''); setNomor(''); setNamaAkun(''); setLevel(''); setUnitId(''); fetchAll(); }
      else { const e = await res.json(); setErrorMsg(e.message); }
    } finally { setSubmitting(false); }
  };

  const startEdit = (item: Item) => {
    setEditItem(item);
    setEditNama(item.nama || item.nama_jabatan || '');
    setEditNomor(item.nomor || '');
    setEditNamaAkun(item.nama_akun || '');
    setEditLevel(String(item.level || ''));
    setEditUnitId(item.unit_id ? String(item.unit_id) : '');
    setEditIsActive(item.is_active ?? true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditing(true);
    try {
      const payload: any = { type: activeTab, id: editItem.id, unit_id: editUnitId ? Number(editUnitId) : null, is_active: editIsActive };
      if (activeTab === 'account') { payload.nomor = editNomor; payload.nama_akun = editNamaAkun; }
      else if (activeTab === 'role') { payload.nama_jabatan = editNama; payload.level = editLevel; }
      else { payload.nama = editNama; }
      const res = await fetch('/api/master', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setEditItem(null); fetchAll(); }
      else { const e = await res.json(); alert(e.message); }
    } finally { setEditing(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus? Data yang sedang dipakai tidak bisa dihapus.')) return;
    const res = await fetch('/api/master', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: activeTab, id }) });
    if (res.ok) fetchAll();
    else { const e = await res.json(); alert(e.message); }
  };

  const toggleStatus = async (item: Item) => {
    const res = await fetch('/api/master', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ type: activeTab, id: item.id, is_active: !item.is_active }) 
    });
    if (res.ok) fetchAll();
  };

  const currentItems = data[activeTab] || [];
  const tab = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Master Data Referensi</h1>
        <p className="mt-1 text-gray-600 text-sm">Kelola data referensi per unit dan status keaktifan untuk form pengajuan anggaran.</p>
      </div>

      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {TABS.filter(t => visibleTabs.includes(t.key)).map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setErrorMsg(''); setNama(''); setNomor(''); setNamaAkun(''); setLevel(''); setUnitId(''); setEditItem(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${activeTab === t.key ? 'bg-muh-green text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition ml-auto"
          title="Atur Tampilan Tab"
        >
          ⚙️
        </button>
      </div>

      {/* Visibility Settings Dropdown/Modal */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Atur Visibilitas Tab Referensi</p>
          <div className="flex flex-wrap gap-4">
            {TABS.map(t => (
              <label key={t.key} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={visibleTabs.includes(t.key)} 
                  onChange={() => toggleTabVisibility(t.key)}
                  className="w-4 h-4 text-muh-green rounded border-gray-300 focus:ring-muh-green"
                />
                <span className={`text-sm font-medium transition ${visibleTabs.includes(t.key) ? 'text-gray-800' : 'text-gray-400'}`}>
                  {t.icon} {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit {tab.label}</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              {activeTab === 'account' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Akun *</label>
                    <input required type="text" value={editNomor} onChange={e => setEditNomor(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun *</label>
                    <input required type="text" value={editNamaAkun} onChange={e => setEditNamaAkun(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                  </div>
                </>
              ) : activeTab === 'role' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jabatan *</label>
                    <input required type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                    <input required type="number" value={editLevel} onChange={e => setEditLevel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                  <input required type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
              )}
              
              {activeTab !== 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Majelis (Kosongkan bila global)</label>
                  <select value={editUnitId} onChange={e => setEditUnitId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white">
                    <option value="">-- [GLOBAL / SEMUA UNIT] --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="edit_active" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="w-4 h-4 text-muh-green rounded" />
                <label htmlFor="edit_active" className="text-sm font-medium text-gray-700 cursor-pointer">Status Aktif</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditItem(null)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={editing} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
                  {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-base text-gray-800 mb-4 border-b pb-2">Tambah {tab.label} Baru</h3>
          {errorMsg && <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{errorMsg}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            {activeTab === 'account' ? (
              <><div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Akun *</label>
                <input required type="text" value={nomor} onChange={e => setNomor(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="5.1.1.01" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun *</label>
                <input required type="text" value={namaAkun} onChange={e => setNamaAkun(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div></>
            ) : activeTab === 'role' ? (
              <><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Jabatan *</label>
                <input required type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <input required type="number" min="1" value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="1=Staf, 2=Atasan..." />
                <p className="text-xs text-gray-400 mt-1">Level 99 = Admin</p></div></>
            ) : (
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input required type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
            )}

            {activeTab !== 'role' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Majelis</label>
                <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white font-medium">
                  <option value="">-- [SET SEBAGAI GLOBAL] --</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full bg-muh-green text-white font-bold py-2.5 rounded-lg hover:bg-muh-green-dark transition shadow-md">
              {submitting ? 'Menyimpan...' : '+ Tambah'}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-500">Memuat...</div> :
            currentItems.length === 0 ? <div className="p-8 text-center text-gray-400">Belum ada data.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b">
                    <tr>
                      <th className="px-5 py-4">Nama</th>
                      <th className="px-5 py-4">Unit / Majelis</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {currentItems.map(item => (
                      <tr key={item.id} className={`hover:bg-gray-50 transition ${!item.is_active ? 'bg-gray-50 opacity-60' : ''}`}>
                        <td className="px-5 py-3">
                          {activeTab === 'account' ? (
                            <div><p className="font-mono text-xs text-blue-700 font-bold">{item.nomor}</p><p className="font-semibold">{item.nama_akun}</p></div>
                          ) : activeTab === 'role' ? (
                            <div className="flex items-center gap-2"><p className="font-bold">{item.nama_jabatan}</p><span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase transition">Level {item.level}</span></div>
                          ) : <p className="font-bold">{item.nama}</p>}
                        </td>
                        <td className="px-5 py-3">
                          {activeTab === 'role' ? '-' : (
                            item.unit ? <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">{item.unit.nama_unit}</span> 
                            : <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold italic border border-gray-200">Global</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => toggleStatus(item)} className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${item.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-bold px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition">Hapus</button>
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
