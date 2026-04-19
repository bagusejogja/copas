"use client";
import { useState, useEffect } from 'react';
import Select from 'react-select';

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
  const [user, setUser] = useState<any>(null);
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
  const [isMounted, setIsMounted] = useState(false);
  const [showInactive, setShowInactive] = useState(false); // Default: Hanya yang aktif
  useEffect(() => { setIsMounted(true); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Ambil identitas user dulu
      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();
      setUser(me);

      // 2. Ambil ID Unit untuk filter (Jika Superadmin, kosongkan agar bisa melihat semua)
      const isSuper = me?.role?.level >= 90;
      const uid = isSuper ? '' : (me?.unit?.id || me?.unit_id || '');
      
      // 3. Ambil data master & unit list secara paralel dengan filter unit yang benar
      const [masterRes, unitsRes] = await Promise.all([
        fetch(`/api/master?unitId=${uid}`),
        fetch('/api/units')
      ]);
      
      const d = await masterRes.json();
      const u = await unitsRes.json();
      
      setData({ expense: d.expenses, activity: d.activities, account: d.accounts, role: d.roles });
      setUnits(u);

      // Lock unit if not superadmin
      if (me?.role?.level < 90 && me?.unit_id) {
         setUnitId(String(me.unit_id));
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
    const saved = localStorage.getItem('master_visible_tabs');
    let tabs: TabKey[] = saved ? JSON.parse(saved) : ['expense', 'activity', 'account', 'role'];
    setVisibleTabs(tabs);
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
      if (res.ok) { 
        setNama(''); setNomor(''); setNamaAkun(''); setLevel(''); 
        // Only reset unit if superadmin
        if (user?.role?.level >= 90) setUnitId(''); 
        fetchAll(); 
      }
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

  const toggleStatus = async (item: any) => {
    const isSuper = user?.role?.level >= 90;
    const myUnitId = Number(user?.unit_id || user?.unit?.id);
    
    // ATURAN: Jika data milik PUSAT (unit_id null)
    if (item.unit_id === null) {
      // 1. Jika dia Superadmin, dia harus mengubah saklar UTAMA (is_active di Master Data)
      if (isSuper) {
        try {
          const res = await fetch('/api/master', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: activeTab, id: item.id, is_active: !item.is_active })
          });
          if (res.ok) fetchAll();
          else alert("Gagal mengubah status utama pusat.");
        } catch (e) { alert("Error koneksi."); }
        return;
      }

      // 2. Jika dia Unit Admin, dia hanya mengubah VISIBILITAS unitnya saja
      if (isNaN(myUnitId) || myUnitId === 0) {
        alert("ID Unit Bapak tidak terbaca. Harap Refresh atau Login ulang.");
        return;
      }

      const isCurrentlyActive = item.is_active_unit ?? false;
      const newStatus = !isCurrentlyActive;
      
      try {
        // Ambil data visibilitas saat ini dari API
        const resVis = await fetch(`/api/master/visibility?type=${activeTab}&refId=${item.id}`);
        const dataVis = await resVis.json();
        const currentUnitIds = (dataVis.unitIds || []).map((id: any) => Number(id));

        const targetIds = newStatus 
          ? Array.from(new Set([...currentUnitIds, myUnitId]))
          : currentUnitIds.filter((id: number) => id !== myUnitId);

        const res = await fetch('/api/master/visibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: activeTab, 
            refId: item.id, 
            unitIds: targetIds 
          })
        });

        if (res.ok) {
          fetchAll();
        } else {
          const e = await res.json();
          alert("Gagal memperbarui status: " + (e.message || "Unknown error"));
        }
      } catch (e) {
        alert("Terjadi kesalahan koneksi saat menyambung ke server.");
      }
      return;
    }

    // Jika data milik Unit sendiri, toggle is_active di tabel master
    try {
      const res = await fetch('/api/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id: item.id, is_active: !item.is_active })
      });
      if (res.ok) fetchAll();
    } catch (e) {
      alert("Gagal mengubah status.");
    }
  };
  const allItems = data[activeTab] || [];
  const currentItems = showInactive 
    ? allItems 
    : allItems.filter(item => {
        const isSuper = user?.role?.level >= 90;
        // Jika Superadmin, gunakan status pusat (is_active). Jika Unit, gunakan status unitnya (is_active_unit).
        const uiStatus = (isSuper || item.unit_id !== null) ? item.is_active : item.is_active_unit;
        return !!uiStatus;
      });

  const tab = TABS.find(t => t.key === activeTab)!;

  const [showVisibility, setShowVisibility] = useState(false);
  const [visRef, setVisRef] = useState<any>(null);
  const [activeUnitIds, setActiveUnitIds] = useState<number[]>([]);
  const [savingVis, setSavingVis] = useState(false);
  const [searchUnit, setSearchUnit] = useState('');

  const openVisibility = async (item: Item) => {
    setVisRef(item);
    setSearchUnit('');
    setShowVisibility(true);
    try {
      const res = await fetch(`/api/master/visibility?type=${activeTab}&refId=${item.id}`);
      const data = await res.json();
      if (data.unitIds) {
        setActiveUnitIds(data.unitIds.map((id: any) => Number(id)));
      } else {
        setActiveUnitIds([]);
      }
    } catch (e) {
      setActiveUnitIds([]);
    }
  };

  const handleSaveVisibility = async () => {
    if (!visRef || !visRef.id) {
      alert("Peringatan: Item referensi tidak ditemukan.");
      return;
    }

    setSavingVis(true);
    try {
      // Pastikan semua ID adalah angka murni
      const uniqueUnitIds = Array.from(new Set(activeUnitIds.map(id => Number(id))));
      
      console.log("Payload yang dikirim:", { 
        type: activeTab, 
        refId: visRef.id, 
        unitIds: uniqueUnitIds 
      });

      const res = await fetch('/api/master/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: activeTab, 
          refId: Number(visRef.id), 
          unitIds: uniqueUnitIds 
        })
      });

      const result = await res.json();

      if (res.ok) {
        setShowVisibility(false);
        alert(`Berhasil! ${result.count || 0} unit telah diperbarui.`);
        fetchAll(); 
      } else {
        alert(`Gagal Menyimpan!\nStatus: ${res.status}\nPesan: ${result.message || 'Tidak ada detail'}\nDetail: ${result.details || '-'}`);
      }
    } catch (e: any) {
      alert(`Kesalahan Jaringan: ${e.message}`);
    } finally { 
      setSavingVis(false); 
    }
  };

  return (
    <div className="p-6">
      {/* Visibility Modal */}
    {showVisibility && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-gray-800 tracking-tight text-lg">Atur Visibilitas Unit</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Aktifkan data ini di unit pilihan</p>
              </div>
              <button onClick={() => setShowVisibility(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">✕</button>
            </div>
            
            <div className="p-6 border-b space-y-4">
               {/* Search & Toggle All */}
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                     <input 
                        type="text" 
                        placeholder="Cari Unit / Majelis..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                        value={searchUnit}
                        onChange={(e) => setSearchUnit(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                     <button 
                        onClick={() => {
                           const filteredIds = units
                              .filter(u => u.nama_unit.toLowerCase().includes(searchUnit.toLowerCase()))
                              .map(u => u.id);
                           const newSet = new Set([...activeUnitIds, ...filteredIds]);
                           setActiveUnitIds(Array.from(newSet));
                        }}
                        className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                     >
                        Check Filtered
                     </button>
                     <button 
                        onClick={() => {
                           const filteredIds = units
                              .filter(u => u.nama_unit.toLowerCase().includes(searchUnit.toLowerCase()))
                              .map(u => u.id);
                           setActiveUnitIds(activeUnitIds.filter(id => !filteredIds.includes(id)));
                        }}
                        className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
                     >
                        Clear Filtered
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {units
                  .filter(u => user?.role?.level >= 90 || u.id === user?.unit_id) // Batasi jika bukan Superadmin
                  .filter(u => u.nama_unit.toLowerCase().includes(searchUnit.toLowerCase()))
                  .map(u => (
                    <label key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${activeUnitIds.includes(u.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        checked={activeUnitIds.includes(u.id)}
                        onChange={(e) => {
                           if (e.target.checked) {
                              if (!activeUnitIds.includes(u.id)) {
                                 setActiveUnitIds([...activeUnitIds, u.id]);
                              }
                           }
                           else {
                              setActiveUnitIds(activeUnitIds.filter(id => id !== u.id));
                           }
                        }}
                    />
                    <div className="overflow-hidden">
                        <p className="text-xs font-black text-gray-700 leading-tight truncate">{u.nama_unit}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-black mt-0.5 tracking-wider">ID: {u.id}</p>
                    </div>
                    </label>
                ))}
              </div>
              {units.filter(u => u.nama_unit.toLowerCase().includes(searchUnit.toLowerCase())).length === 0 && (
                <div className="py-10 text-center">
                    <p className="text-gray-400 text-sm font-bold italic">Unit tidak ditemukan...</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                {activeUnitIds.length} Unit Terpilih
              </p>
              <div className="flex gap-3">
                <button 
                    onClick={() => setShowVisibility(false)}
                    className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-all"
                >
                    Batal
                </button>
                <button 
                    disabled={savingVis} 
                    onClick={handleSaveVisibility}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                >
                    {savingVis ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Master Data Referensi</h1>
        <p className="mt-1 text-gray-600 text-sm">Kelola data referensi per unit dan status keaktifan untuk form pengajuan anggaran.</p>
      </div>

      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {TABS.filter(t => visibleTabs.includes(t.key))
           .filter(t => user?.role?.level >= 90 || t.key !== 'role')
           .map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setErrorMsg(''); setNama(''); setNomor(''); setNamaAkun(''); setLevel(''); if(user?.role?.level >= 90) setUnitId(''); setEditItem(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${activeTab === t.key ? 'bg-muh-green text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-all select-none group">
            <input 
              type="checkbox" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className={`text-[10px] font-black uppercase tracking-wider ${showInactive ? 'text-emerald-700' : 'text-gray-400'}`}>
              {showInactive ? '🗂️ Tampilkan Semua' : '✅ Hanya Aktif'}
            </span>
          </label>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition ${showSettings ? 'bg-muh-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Atur Tampilan Tab"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Visibility Settings Dropdown/Modal */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Atur Visibilitas Tab Referensi</p>
          <div className="flex flex-wrap gap-4">
            {TABS.filter(t => user?.role?.level >= 90 || t.key !== 'role').map(t => (
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

      <div className={`grid grid-cols-1 ${user?.role?.level >= 90 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {/* Form Tambah: Hanya muncul untuk Superadmin */}
        {user?.role?.level >= 90 && (
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

            <button type="submit" disabled={submitting} className="w-full bg-muh-green text-white font-bold py-2.5 rounded-lg hover:bg-muh-green-dark transition shadow-md">
              {submitting ? 'Menyimpan...' : '+ Tambah'}
            </button>
          </form>
          </div>
        )}

        {/* Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${user?.role?.level >= 90 ? 'lg:col-span-2' : 'lg:col-span-1'} overflow-hidden`}>
          {loading ? <div className="p-8 text-center text-gray-500">Memuat...</div> :
            currentItems.length === 0 ? <div className="p-8 text-center text-gray-400">Belum ada data.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b">
                     <tr>
                        <th className="px-5 py-4 text-left">Nama</th>
                        <th className="px-5 py-4 text-center">Status</th>
                        {/* Kolom Aksi muncul jika: 1. Superadmin atau 2. Ada data lokal milik unit ini */}
                        {(user?.role?.level >= 90 || currentItems.some(item => item.unit_id !== null && Number(item.unit_id) === Number(user?.unit_id))) && (
                          <th className="px-5 py-4 text-center">Aksi</th>
                        )}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                           {/* ... (keep Name cell same) */}
                           <td className="px-5 py-3">
                             {activeTab === 'role' ? (
                               <div className="flex items-center gap-2"><p className="font-bold">{item.nama_jabatan}</p><span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase transition">Level {item.level}</span></div>
                             ) : (
                               <div className="flex flex-col">
                                 <span className="font-bold text-gray-800 text-sm group-hover:text-muh-green transition-colors leading-tight">
                                   {item.nama || item.nama_kegiatan || item.nama_akun || item.nama_jabatan}
                                 </span>
                                 <div className="flex items-center gap-2 mt-1">
                                    {item.unit_id === null ? (
                                      <span className="text-[8px] font-black bg-muh-green/10 text-muh-green px-1.5 py-0.5 rounded uppercase tracking-widest">Master Pusat</span>
                                    ) : (
                                      <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Lokal Unit</span>
                                    )}
                                    <span className="text-[8px] text-gray-200">|</span>
                                    <span className="text-[8px] font-mono text-gray-400">#{item.id}</span>
                                 </div>
                               </div>
                             )}
                           </td>
                           
                           {/* STATUS COLUMN - Now with Visibility Toggle for Units */}
                           <td className="px-5 py-3 text-center">
                             <div className="flex flex-col items-center gap-1.5">
                                <button 
                                  onClick={() => toggleStatus(item)} 
                                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition border shadow-sm ${ (user?.role?.level >= 90 || item.unit_id !== null ? item.is_active : item.is_active_unit) ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                >
                                  {(user?.role?.level >= 90 || item.unit_id !== null ? item.is_active : item.is_active_unit) ? '● Aktif' : '○ Nonaktif'}
                                </button>
                                
                                {/* Untuk Login Unit, tombol Aktifkan/Gunakan ditaruh di sini saja */}
                                {user?.role?.level < 90 && activeTab !== 'role' && (
                                   <button 
                                     onClick={() => openVisibility(item)} 
                                     className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-lg transition ${ (item.is_active_unit) ? 'bg-indigo-600 text-white border-indigo-600' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                   >
                                     {item.is_active_unit ? '✓ Terpakai' : '+ Gunakan'}
                                   </button>
                                )}
                             </div>
                           </td>

                           {/* Cell Aksi - Harus konsisten dengan Header agar tidak miring */}
                           {(user?.role?.level >= 90 || currentItems.some(item => item.unit_id !== null && Number(item.unit_id) === Number(user?.unit_id))) && (
                             <td className="px-5 py-3 text-center">
                               <div className="flex gap-2 justify-center">
                                 {user?.role?.level >= 90 && activeTab !== 'role' && (
                                   <button 
                                     onClick={() => openVisibility(item)} 
                                     className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-600 text-white border border-indigo-600 rounded-xl transition shadow-sm hover:bg-indigo-700"
                                   >
                                     <span>⚙️</span> Atur Unit
                                   </button>
                                 )}
                                 
                                 {(user?.role?.level >= 90 || (item.unit_id !== null && Number(item.unit_id) === Number(user?.unit_id))) && (
                                   <>
                                     <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-bold px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition">Edit</button>
                                     <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition">Hapus</button>
                                   </>
                                 )}
                               </div>
                             </td>
                           )}
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
