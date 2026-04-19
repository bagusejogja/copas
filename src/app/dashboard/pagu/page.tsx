"use client";
import { useState, useEffect, useMemo } from 'react';

export default function PaguManagementPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [localPagu, setLocalPagu] = useState<Record<number, string>>({});
  const [user, setUser] = useState<any>(null);
  
  // Tree Selector States
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pagu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUnits(data);
        const mapping: Record<number, string> = {};
        data.forEach(u => {
          const p = u.paguRecords.find((r: any) => r.tahun === selectedYear);
          mapping[u.id] = p ? String(p.nominal) : '0';
        });
        setLocalPagu(mapping);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetch('/api/auth/me').then(res => res.json()).then(setUser);
    fetchUnits(); 
  }, [selectedYear]);

  const handleUpdateLocal = (unitId: number, val: string) => {
    const numericVal = val.replace(/[^0-9]/g, '');
    setLocalPagu(prev => ({ ...prev, [unitId]: numericVal }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const unitId in localPagu) {
        await fetch('/api/pagu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unit_id: unitId, tahun: selectedYear, nominal: localPagu[unitId] })
        });
      }
      alert('✅ Pagu berhasil disimpan!');
      fetchUnits();
    } finally { setSaving(false); }
  };

  // Tree Helper
  const buildLocalTree = (flatList: any[], parentId: number | null = null): any[] => {
    return flatList
      .filter(u => u.parent_unit_id === parentId)
      .map(u => ({ ...u, children: buildLocalTree(flatList, u.id) }));
  };

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const renderTreeNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = String(node.id) === unitFilter;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-muh-green text-white shadow-sm' : 'hover:bg-gray-50 text-gray-700'}`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => { setUnitFilter(String(node.id)); setIsTreeOpen(false); }}
        >
          {hasChildren ? (
            <button onClick={(e) => toggleExpand(e, node.id)} className={`w-4 h-4 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</button>
          ) : <span className="w-4"></span>}
          <span className="text-xs font-bold">{node.tipe === 'GROUP' ? '📁' : '🏢'} {node.nama_unit}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5">{node.children.map((child: any) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const filteredUnits = useMemo(() => {
    if (!unitFilter) return units;
    // Tampilkan unit yang terpilih DAN anak-anaknya? Atau cuma yang terpilih?
    // Biasanya untuk Pagu, kita ingin fokus ke satu unit.
    return units.filter(u => String(u.id) === unitFilter || u.parent_unit_id === Number(unitFilter));
  }, [units, unitFilter]);

  const treeData = buildLocalTree(units, null);
  const selectedUnitName = unitFilter ? (units.find(u => String(u.id) === unitFilter)?.nama_unit || 'Unit Terpilih') : 'Semua Unit';
  const fmt = (n: any) => (Number(n) || 0).toLocaleString('id-ID');

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen pb-40">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manajemen Pagu Unit</h1>
          <p className="text-xs text-gray-500 font-medium">Pengaturan Batas Anggaran Tahunan</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tree Selector Component */}
          <div className="relative">
            <div 
              onClick={() => setIsTreeOpen(!isTreeOpen)}
              className="flex items-center gap-3 bg-white px-4 py-2 border rounded-xl shadow-sm hover:border-muh-green cursor-pointer min-w-[240px] transition-all"
            >
              <span className="text-lg">{unitFilter ? '🏢' : '📊'}</span>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Kerja:</p>
                <p className="text-xs font-bold text-gray-800 truncate">{selectedUnitName}</p>
              </div>
              <span className="text-gray-400 text-[10px]">▼</span>
            </div>

            {isTreeOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsTreeOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border p-2 z-30 min-w-[300px] max-h-[400px] overflow-y-auto">
                  <div 
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer mb-2 text-xs font-bold ${!unitFilter ? 'bg-muh-green text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                    onClick={() => { setUnitFilter(''); setIsTreeOpen(false); }}
                  >
                    📊 Tampilkan Semua Unit
                  </div>
                  <div className="h-px bg-gray-100 my-1"></div>
                  {treeData.map(node => renderTreeNode(node))}
                </div>
              </>
            )}
          </div>

          <div className="bg-white px-4 py-2 border rounded-xl shadow-sm flex items-center gap-3">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tahun:</span>
             <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border-0 p-0 focus:ring-0 font-bold text-muh-green text-sm bg-transparent">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>

          <button onClick={handleSaveAll} disabled={saving} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2">
            {saving ? '⏳...' : '💾 Simpan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
             <div className="col-span-full py-20 text-center text-gray-400 text-xs font-bold animate-pulse">Memuat Unit...</div>
        ) : filteredUnits.map(u => {
             const currentPagu = u.paguRecords.find((r: any) => r.tahun === selectedYear);
             const val = localPagu[u.id] || '0';
             return (
                <div key={u.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-muh-green shadow-sm transition-all group">
                   <div className="flex justify-between items-start mb-3">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-0.5">ID: {u.id}</p>
                        <h3 className="text-sm font-black text-gray-800 leading-tight truncate">{u.nama_unit}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${currentPagu ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                         {currentPagu ? 'Set' : 'Empty'}
                      </span>
                   </div>

                   <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 group-focus-within:text-muh-green transition-colors">Rp</div>
                      <input 
                         type="text" 
                         value={fmt(val)}
                         onChange={(e) => handleUpdateLocal(u.id, e.target.value)}
                         className="w-full pl-9 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl font-mono text-sm font-black text-gray-900 focus:bg-white focus:border-muh-green/30 focus:ring-0 transition-all text-right"
                         placeholder="0"
                      />
                   </div>
                </div>
             );
        })}
      </div>

      <div className="fixed bottom-8 right-8 z-50">
         <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-end border border-white/10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total {selectedYear}</p>
            <p className="text-xl font-black text-muh-green">Rp {fmt(Object.values(localPagu).reduce((s, v) => s + (Number(v) || 0), 0))}</p>
            <button onClick={handleSaveAll} disabled={saving} className="mt-3 w-full py-2 bg-muh-green text-white rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-all">SIMPAN SEMUA</button>
         </div>
      </div>
    </div>
  );
}
