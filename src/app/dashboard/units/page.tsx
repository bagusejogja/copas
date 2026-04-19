"use client";
import { useState, useEffect, useCallback } from 'react';

type UnitNode = {
  id: number;
  nama_unit: string;
  nama_unit_pendek: string | null;
  pemerhati: string | null;
  tipe: string;
  parent_unit_id: number | null;
  _count?: { child_units: number; users: number; proposals: number; programKerjas: number };
  children: UnitNode[];
};

const EMPTY_FORM = { nama_unit: '', nama_unit_pendek: '', pemerhati: '', tipe: 'UNIT', parent_unit_id: '' };

function TreeNode({ node, level, allFlat, onEdit, onAddChild, expandedIds, toggleExpand }: {
  node: UnitNode; level: number; allFlat: UnitNode[];
  onEdit: (u: UnitNode) => void; onAddChild: (parentId: number) => void;
  expandedIds: Set<number>; toggleExpand: (id: number) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isGroup = node.tipe === 'GROUP';

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all hover:bg-gray-50 group ${level === 0 ? 'bg-emerald-50/50 border border-emerald-100' : ''}`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <button
          onClick={() => toggleExpand(node.id)}
          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all ${hasChildren ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-transparent text-gray-200 cursor-default'}`}
          disabled={!hasChildren}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : '·'}
        </button>
        <span className="text-lg shrink-0">
          {isGroup ? '📁' : (level === 0 ? '🏛️' : '🏢')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-gray-800 truncate ${level === 0 ? 'text-base' : 'text-sm'}`}>{node.nama_unit}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${isGroup ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-500'}`}>
              {node.tipe}
            </span>
            {node.nama_unit_pendek && (
              <span className="text-[10px] text-gray-400 font-mono shrink-0">({node.nama_unit_pendek})</span>
            )}
          </div>
          {node._count && (
            <div className="flex gap-3 mt-0.5">
              {node._count.child_units > 0 && <span className="text-[9px] text-gray-400">{node._count.child_units} sub-unit</span>}
              {node._count.users > 0 && <span className="text-[9px] text-gray-400">{node._count.users} user</span>}
              {node._count.proposals > 0 && <span className="text-[9px] text-emerald-500">{node._count.proposals} usulan</span>}
              {node._count.programKerjas > 0 && <span className="text-[9px] text-blue-500">{node._count.programKerjas} proker</span>}
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onAddChild(node.id)} className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold hover:bg-emerald-100 transition">+ Anak</button>
          <button onClick={() => onEdit(node)} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition">✎ Edit</button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-dashed border-gray-200 ml-6">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} level={level + 1} allFlat={allFlat} onEdit={onEdit} onAddChild={onAddChild} expandedIds={expandedIds} toggleExpand={toggleExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UnitsPage() {
  const [tree, setTree] = useState<UnitNode[]>([]);
  const [flatUnits, setFlatUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTree, resFlat] = await Promise.all([
        fetch('/api/units?format=tree'),
        fetch('/api/units')
      ]);
      const dataTree = await resTree.json();
      const dataFlat = await resFlat.json();
      setTree(Array.isArray(dataTree) ? dataTree : []);
      setFlatUnits(Array.isArray(dataFlat) ? dataFlat : []);
      const ids = new Set<number>();
      (Array.isArray(dataFlat) ? dataFlat : []).forEach((u: any) => {
        if (u.parent_unit_id === null || u.parent_unit_id === 1) ids.add(u.id);
      });
      if (dataFlat?.[0]?.id) ids.add(dataFlat[0].id);
      setExpandedIds(prev => new Set([...prev, ...ids]));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const expandAll = () => setExpandedIds(new Set(flatUnits.map(u => u.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const openAddChild = (parentId: number) => {
    setEditId(null); setForm({ ...EMPTY_FORM, parent_unit_id: String(parentId) }); setShowForm(true);
  };
  const openEdit = (unit: UnitNode) => {
    setEditId(unit.id);
    setForm({ nama_unit: unit.nama_unit, nama_unit_pendek: unit.nama_unit_pendek || '', pemerhati: unit.pemerhati || '', tipe: unit.tipe, parent_unit_id: unit.parent_unit_id ? String(unit.parent_unit_id) : '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama_unit.trim()) { alert('Nama unit wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = { ...(editId ? { id: editId } : {}), nama_unit: form.nama_unit, nama_unit_pendek: form.nama_unit_pendek || null, pemerhati: form.pemerhati || null, tipe: form.tipe, parent_unit_id: form.parent_unit_id ? Number(form.parent_unit_id) : null };
      const res = await fetch('/api/units', { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchData(); }
      else { const err = await res.json(); alert(err.message || 'Gagal menyimpan'); }
    } finally { setSaving(false); }
  };

  const parentName = form.parent_unit_id ? flatUnits.find(u => u.id === Number(form.parent_unit_id))?.nama_unit || '-' : '(Root / Tidak Ada Induk)';

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Unit</h1>
          <p className="mt-1 text-gray-500 text-sm font-medium italic">Struktur Organisasi Berjenjang (Hierarki)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-[10px] px-3 py-2 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200">⬇ Buka Semua</button>
          <button onClick={collapseAll} className="text-[10px] px-3 py-2 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200">⬆ Tutup Semua</button>
          <button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }} className="bg-muh-green text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-muh-green-dark transition-all">+ Unit Baru</button>
        </div>
      </div>

      <div className="mb-6 flex gap-4 items-center text-[10px]">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-purple-100 rounded"></span> <b className="text-purple-600">GROUP</b> = Folder/Pengelompokan (tidak punya anggaran)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-50 rounded"></span> <b className="text-blue-500">UNIT</b> = Unit Operasional (punya anggaran & proker)</span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center p-16 gap-3">
            <div className="w-6 h-6 border-2 border-muh-green/30 border-t-muh-green rounded-full animate-spin"></div>
            <span className="text-gray-500 text-sm">Memuat pohon organisasi...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="text-gray-700 font-bold text-lg">Belum ada unit terdaftar.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map(node => (
              <TreeNode key={node.id} node={node} level={0} allFlat={flatUnits} onEdit={openEdit} onAddChild={openAddChild} expandedIds={expandedIds} toggleExpand={toggleExpand} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden stagger-fade-in">
            <div className="p-6 border-b bg-blue-900 text-white">
              <h3 className="font-bold text-lg">{editId ? '✎ Edit Unit' : '+ Tambah Unit Baru'}</h3>
              <p className="text-xs text-white/60 mt-1">Induk: <span className="text-yellow-300 font-bold">{parentName}</span></p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nama Unit *</label>
                <input value={form.nama_unit} onChange={e => setForm({ ...form, nama_unit: e.target.value })} type="text" placeholder="Misal: SDM Suronatan" className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-muh-green" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Singkatan</label>
                  <input value={form.nama_unit_pendek} onChange={e => setForm({ ...form, nama_unit_pendek: e.target.value })} type="text" placeholder="SDM-SR" className="w-full border-gray-200 rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tipe Unit *</label>
                  <select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })} className="w-full border-gray-200 rounded-xl p-3 text-sm font-bold">
                    <option value="UNIT">🏢 UNIT (Operasional)</option>
                    <option value="GROUP">📁 GROUP (Folder)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Induk (Parent)</label>
                <select value={form.parent_unit_id} onChange={e => setForm({ ...form, parent_unit_id: e.target.value })} className="w-full border-gray-200 rounded-xl p-3 text-sm">
                  <option value="">-- Tidak Ada Induk (Root) --</option>
                  {flatUnits.filter(u => u.id !== editId).map(u => (
                    <option key={u.id} value={u.id}>{u.parent_unit?.nama_unit ? `${u.parent_unit.nama_unit} → ` : ''}{u.nama_unit} [{u.tipe}]</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pemerhati</label>
                <input value={form.pemerhati} onChange={e => setForm({ ...form, pemerhati: e.target.value })} type="text" placeholder="Nama Pemerhati (Opsional)" className="w-full border-gray-200 rounded-xl p-3 text-sm" />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex gap-3">
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                {saving ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : '+ Tambah Unit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
