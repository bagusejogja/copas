"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Select from 'react-select';

type DashData = {
  stats: { 
    totalUsulan: number; 
    pendingUsulan: number; 
    approvedFinal: number; 
    paidUsulan: number;
    totalUsers: number;
    totalNominalDiajukan: number;
    totalNominalPending: number;
    totalNominalFinal: number;
    totalNominalPaid: number;
    totalAnggaranSetahun: number;
  };
  unitSummary: { id: number; nama_unit: string; diajukan: number; disetujui: number; totalAnggaran: number; totalDisetujui: number; totalSPJ: number }[];
  prokerSummary: { id: number; nama_kegiatan: string; anggaran: number; diajukan: number; disetujui: number; diambil: number; dilaporkan: number; sisa: number }[];
  recentProposals: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitsInfo, setUnitsInfo] = useState<any[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());
  
  // Tree Selector States (Moved to top level to follow React Rules of Hooks)
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(setUser);
  }, []);

  // ... (previous useEffect kept same)
  useEffect(() => {
    setLoading(true);
    const url = unitFilter ? `/api/dashboard?unit_id=${unitFilter}` : '/api/dashboard';
    
    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/api/units').then(res => res.json())
    ])
      .then(([dash, units]) => {
        setData(dash);
        setUnitsInfo(units);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [unitFilter]);

  // Helper for Tree Selector
  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const renderTreeNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = String(node.id) === unitFilter;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-muh-green text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => {
            setUnitFilter(String(node.id));
            setIsTreeOpen(false);
          }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(e, node.id)}
              className={`w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              ▶
            </button>
          ) : <span className="w-5"></span>}
          <span className="text-sm">
            {node.tipe === 'GROUP' ? '📁' : '🏢'} {node.nama_unit}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const buildLocalTree = (flatList: any[], parentId: number | null = null): any[] => {
    return flatList
      .filter(u => u.parent_unit_id === parentId)
      .map(u => ({ ...u, children: buildLocalTree(flatList, u.id) }));
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED_LV1: 'bg-blue-100 text-blue-800',
      APPROVED_LV2: 'bg-indigo-100 text-indigo-800',
      APPROVED_FINAL: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-emerald-600 text-white shadow-sm',
    };
    const labels: Record<string, string> = {
      PENDING: 'Menunggu',
      APPROVED_LV1: 'Disetujui Atasan',
      APPROVED_LV2: 'Review Pusat',
      APPROVED_FINAL: 'Cair/Final',
      REJECTED: 'Ditolak',
      PAID: 'Sudah Cair',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  const fmt = (n: number | undefined | null) => (n || 0).toLocaleString('id-ID');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (loading) return (
    <div className="p-10 flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg font-bold">Menyiapkan Dashboard Berkelas...</div>
    </div>
  );

  const treeData = buildLocalTree(unitsInfo, null);
  const selectedUnitName = unitFilter ? (unitsInfo.find((u: any) => String(u.id) === unitFilter)?.nama_unit || 'Unit Terpilih') : 'Ringkasan Gabungan (Total)';

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Anggaran</h1>
          <p className="text-gray-500 text-sm">Monitor realisasi & pelaporan SPJ secara real-time.</p>
        </div>
        
        {/* Filter Panel Custom Tree Selector */}
        {(user?.role?.level >= 50 || user?.unit?.tipe === 'GROUP' || user?.unit?.id === 1) && (
          <div className="relative">
            <div 
              onClick={() => setIsTreeOpen(!isTreeOpen)}
              className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-muh-green cursor-pointer min-w-[320px] group"
            >
              <div className="w-8 h-8 bg-muh-green/10 text-muh-green rounded-xl flex items-center justify-center text-lg group-hover:bg-muh-green group-hover:text-white transition-colors">
                {unitFilter ? '🏢' : '📊'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pantauan Unit:</p>
                <p className="text-xs font-bold text-gray-800 truncate">{selectedUnitName}</p>
              </div>
              <div className={`text-gray-400 text-[10px] transition-transform ${isTreeOpen ? 'rotate-180' : ''}`}>▼</div>
            </div>

            {isTreeOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsTreeOpen(false)}></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-30 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <div 
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer mb-2 ${!unitFilter ? 'bg-muh-green text-white shadow-md' : 'hover:bg-gray-50 text-gray-700 font-bold'}`}
                    onClick={() => {
                      setUnitFilter('');
                      setIsTreeOpen(false);
                    }}
                  >
                    📊 Tampilkan Ringkasan Gabungan (Semua)
                  </div>
                  <div className="h-px bg-gray-100 my-2"></div>
                  {treeData.map(node => renderTreeNode(node))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* NEW COMPACT: Financial Overview Header */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 no-print">
         {/* Pagu Proker Insight Card (Moved to Left) */}
         <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
               <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Wawasan Program Kerja (Proker)</p>
                  <div className="mb-3">
                     <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">Digital Pagu (Jatah)</p>
                     <p className="text-xl font-black text-white">Rp {fmt(data?.stats.totalUnitPagu || 0)}</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">Pagu Proker (Rencana)</p>
                     <p className="text-lg font-bold text-yellow-400">Rp {fmt(data?.stats.totalAnggaranSetahun || 0)}</p>
                  </div>
               </div>
               
               <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                     <p className="text-[9px] text-white/40 uppercase font-bold">Total Proker Aktif</p>
                     <p className="text-lg font-black text-yellow-400">{data?.stats.totalUsulan || 0}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] text-white/40 uppercase font-bold">Menunggu Approve</p>
                     <p className="text-lg font-black text-orange-400">{data?.stats.pendingUsulan || 0}</p>
                  </div>
               </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
            </div>
         </div>

         <div className="xl:col-span-2 bg-gradient-to-br from-white to-gray-50/50 rounded-[2rem] p-6 border border-gray-100 shadow-xl flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full space-y-5">
               <div className="flex justify-between items-baseline">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ringkasan Serapan Dana</h3>
                  <span className="text-xl font-black text-muh-green">{data?.stats?.totalAnggaranSetahun ? ((data.stats.totalNominalPaid / data.stats.totalAnggaranSetahun) * 100).toFixed(1) : '0.0'}%</span>
               </div>
               
               <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                      <span>1. Pencairan Pagu Proker ({data?.stats.totalAnggaranSetahun > 0 ? ((data?.stats.totalNominalPaid / data.stats.totalAnggaranSetahun) * 100).toFixed(1) : 0}%)</span>
                      <span>Rp {fmt(data?.stats.totalNominalPaid || 0)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                       <div className="bg-blue-600 h-full rounded-full shadow-sm" style={{ width: `${Math.min(100, (data?.stats.totalNominalPaid / (data?.stats.totalAnggaranSetahun || 1)) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                      <span>2. Laporan Pertanggungjawaban (SPJ)</span>
                      <span>Rp {fmt(data?.stats?.totalNominalSPJ || 0)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                       <div className="bg-muh-green h-full rounded-full shadow-sm" style={{ width: `${Math.min(100, (data?.stats?.totalNominalSPJ / (data?.stats.totalAnggaranSetahun || 1)) * 100)}%` }}></div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="h-px md:h-20 w-full md:w-px bg-gray-200"></div>

            <div className="w-full md:w-auto min-w-[220px] bg-blue-600 rounded-[1.5rem] p-5 text-white shadow-lg shadow-blue-100 relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Sisa Pagu Proker</p>
                  <p className="text-2xl font-black tracking-tighter">Rp {fmt((data?.stats.totalAnggaranSetahun || 0) - (data?.stats.totalNominalPaid || 0))}</p>
                  <div className="mt-3 flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-fit">
                     <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                     <span className="text-[10px] font-black uppercase tracking-wider">SIAP DISERAP</span>
                  </div>
               </div>
               <svg className="absolute -bottom-2 -right-2 w-16 h-16 text-white/10 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
         </div>
      </div>

      {/* 5 KARTU STATISTIK BERWARNA-WARNI */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 no-print">
        {/* USULAN ANGGARAN - INDIGO */}
        <Link href="/dashboard/proposals" className="bg-indigo-600 text-white p-5 rounded-[2rem] shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all group">
           <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Usulan Anggaran</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">Rp {fmt(data?.stats.totalNominalDiajukan ?? 0)}</p>
           </div>
           <p className="text-[9px] text-white/40 uppercase font-black mt-2 tracking-wider">{data?.stats.totalUsulan ?? 0} Usulan Terdaftar</p>
        </Link>

        {/* MENUNGGU - ORANGE */}
        <Link href="/dashboard/proposals?status=PENDING" className="bg-orange-500 text-white p-5 rounded-[2rem] shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all group">
           <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Menunggu Disetujui</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">Rp {fmt(data?.stats.totalNominalPending ?? 0)}</p>
           </div>
           <p className="text-[9px] text-white/40 uppercase font-black mt-2 tracking-wider">{data?.stats.pendingUsulan ?? 0} Perlu Persetujuan</p>
        </Link>

        {/* USULAN DISETUJUI - TEAL */}
        <Link href="/dashboard/proposals?status=APPROVED" className="bg-teal-600 text-white p-5 rounded-[2rem] shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all group">
           <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Usulan Disetujui</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">Rp {fmt(data?.stats.totalNominalFinal ?? 0)}</p>
           </div>
           <p className="text-[9px] text-white/40 uppercase font-black mt-2 tracking-wider">{data?.stats.approvedFinal ?? 0} Usulan Selesai</p>
        </Link>

        {/* PENCAIRAN USULAN - BLUE */}
        <Link href="/dashboard/proposals?status=PAID" className="bg-blue-600 text-white p-5 rounded-[2rem] shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all group">
           <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 0 00-2 2v6a2 0 002 2h2m2 4h10a2 0 002-2v-6a2 0 00-2-2H9a2 0 00-2 2v6a2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Pencairan Usulan</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">Rp {fmt(data?.stats.totalNominalPaid)}</p>
           </div>
           <p className="text-[9px] text-white/40 uppercase font-black mt-2 tracking-wider">{data?.stats.paidUsulan || 0} Usulan Cair</p>
        </Link>

        {/* TOTAL SPJ (LPJ) - HIJAU */}
        <Link href="/dashboard/pertanggungjawaban" className="bg-muh-green text-white p-5 rounded-[2rem] shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all group">
           <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Total SPJ (LPJ)</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">
                 Rp {fmt(data?.stats?.totalNominalSPJ || 0)}
              </p>
           </div>
           <p className="text-[9px] text-white/40 uppercase font-black mt-2 tracking-wider">Update Real-time</p>
        </Link>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 mb-8 no-print">
         
         {/* Unit Summary Table - Combined View */}
         <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
               <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">Leaderboard & Radar Penyerapan Unit</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Monitor Serapan Dana & Kepatuhan SPJ (🛡️ Sistem Proteksi)</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase">Total Realisasi</p>
                     <p className="text-sm font-black text-muh-green">Rp {fmt(data?.stats.totalNominalPaid)}</p>
                  </div>
                  <div className="w-10 h-10 bg-muh-green/10 text-muh-green rounded-2xl flex items-center justify-center animate-pulse">👑</div>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900 text-white/50 text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                     <tr>
                        <th className="px-8 py-5 text-center">#</th>
                        <th className="px-6 py-5">Unit Kerja</th>
                        <th className="px-6 py-5 text-right">Pagu Tahunan</th>
                        <th className="px-6 py-5 text-right w-40">Rencana Proker</th>
                        <th className="px-6 py-5 text-right w-40">Diajukan</th>
                        <th className="px-6 py-5 text-right w-40">Cair (Realisasi)</th>
                        <th className="px-6 py-5 text-center">Pertanggungjawaban</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {user?.role?.level >= 90 ? (
                        // MODE PIMPINAN: Tampilan Hierarki (Pohon)
                        (() => {
                          const buildTree = (list: any[], parentId: number | null = null): any[] => {
                            return list
                              .filter(item => {
                                if (parentId === null) return !item.parent_unit_id || item.parent_unit_id === 0;
                                return item.parent_unit_id === parentId;
                              })
                              .map(item => ({ ...item, children: buildTree(list, item.id) }));
                          };
                          const tree = buildTree(data?.unitSummary || [], null);
                          
                          const renderRows = (nodes: any[], level = 0): any => {
                            return nodes.map(u => {
                              const hasChildren = u.children && u.children.length > 0;
                              const isExpanded = expandedNodes.has(u.id);
                              
                              const pctRencana = u.consolidatedPagu > 0 ? (u.totalPaguProker / u.consolidatedPagu) * 100 : 0;
                              const pctDiajukan = u.totalPaguProker > 0 ? (u.totalAnggaran / u.totalPaguProker) * 100 : 0;
                              const pctCair = u.totalAnggaran > 0 ? (u.totalDisetujui / u.totalAnggaran) * 100 : 0;
                              const spjPct = u.totalDisetujui > 0 ? (u.totalSPJ / u.totalDisetujui) * 100 : 0;

                              return (
                                <React.Fragment key={u.id}>
                                  <tr className={`hover:bg-muh-green/5 transition-colors group ${level > 0 ? 'bg-gray-50/20' : ''}`}>
                                     <td className="px-8 py-5 text-center">
                                        {hasChildren ? (
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); toggleExpand(e, u.id); }}
                                              className={`w-6 h-6 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-[8px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                           >
                                              ▶
                                           </button>
                                        ) : <span className="w-6 h-6 flex items-center justify-center text-[8px] text-gray-200">●</span>}
                                     </td>
                                     <td className="px-6 py-5" style={{ paddingLeft: `${level * 24 + 24}px` }}>
                                        <p className="font-bold text-gray-800 group-hover:text-muh-green transition-colors text-sm leading-tight">
                                           {u.tipe === 'GROUP' ? '📁' : '🏢'} {u.nama_unit}
                                        </p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Level {level + 1} {u.tipe}</p>
                                     </td>
                                     <td className="px-6 py-5 text-right">
                                        <p className="text-[11px] font-mono text-gray-400">Rp {fmt(u.consolidatedPagu)}</p>
                                     </td>
                                     <td className="px-6 py-5">
                                        <div className="flex flex-col items-end">
                                           <p className="text-sm font-black text-gray-700 font-mono">Rp {fmt(u.totalPaguProker || 0)}</p>
                                           <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                              <div className="bg-gray-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctRencana)}%` }}></div>
                                           </div>
                                           <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{pctRencana.toFixed(0)}% DARI PAGU</p>
                                        </div>
                                     </td>
                                     <td className="px-6 py-5">
                                        <div className="flex flex-col items-end">
                                           <p className="text-sm font-black text-orange-600">Rp {fmt(u.totalAnggaran)}</p>
                                           <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                              <div className="bg-orange-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctDiajukan)}%` }}></div>
                                           </div>
                                           <span className="text-[8px] font-black text-orange-400 mt-1 uppercase">{pctDiajukan.toFixed(0)}% DARI RENCANA</span>
                                        </div>
                                     </td>
                                     <td className="px-6 py-5">
                                        <div className="flex flex-col items-end">
                                           <span className="font-black text-muh-green text-sm">Rp {fmt(u.totalDisetujui || 0)}</span>
                                           <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                              <div className="bg-muh-green h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctCair)}%` }}></div>
                                           </div>
                                           <span className="text-[8px] font-black text-muh-green mt-1 uppercase">{pctCair.toFixed(0)}% DARI AJUAN</span>
                                        </div>
                                     </td>
                                     <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                           <div className="text-right border-r border-gray-100 pr-4 min-w-[120px]">
                                              <p className="text-sm font-black text-muh-green">Rp {fmt(u.totalSPJ || 0)}</p>
                                              {u.totalSPJProcess > 0 && (
                                                 <p className="text-[9px] font-black text-orange-500 mt-0.5 italic animate-pulse">+ Rp {fmt(u.totalSPJProcess)} (Review)</p>
                                              )}
                                              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                                 <div className="bg-muh-green h-full transition-all duration-1000" style={{ width: `${Math.min(100, spjPct)}%` }}></div>
                                              </div>
                                              <p className="text-[8px] text-gray-300 font-bold tracking-widest uppercase mt-1">{spjPct.toFixed(0)}% LAPOR</p>
                                           </div>
                                           {spjPct >= 80 ? (
                                              <div className="relative group/tool">
                                                 <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-sm border border-emerald-200 animate-in zoom-in duration-300">🛡️</div>
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[8px] px-2 py-1 rounded hidden group-hover/tool:block whitespace-nowrap z-50 shadow-xl">SISTEM PROTEKSI AKTIF</div>
                                              </div>
                                           ) : (
                                              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center text-lg border border-orange-100 opacity-30">⏳</div>
                                           )}
                                        </div>
                                     </td>
                                  </tr>
                                  {hasChildren && isExpanded && renderRows(u.children, level + 1)}
                                </React.Fragment>
                              );
                            });
                          };
                          return renderRows(tree);
                        })()
                     ) : (
                        // MODE UNIT: Tampilan Leaderboard (Flat Sorting)
                        data?.unitSummary?.sort((a: any, b: any) => b.totalDisetujui - a.totalDisetujui).map((u: any, idx: number) => {
                           const pctRencana = u.consolidatedPagu > 0 ? (u.totalPaguProker / u.consolidatedPagu) * 100 : 0;
                           const pctDiajukan = u.totalPaguProker > 0 ? (u.totalAnggaran / u.totalPaguProker) * 100 : 0;
                           const pctCair = u.totalAnggaran > 0 ? (u.totalDisetujui / u.totalAnggaran) * 100 : 0;
                           const spjPct = u.totalDisetujui > 0 ? (u.totalSPJ / u.totalDisetujui) * 100 : 0;
                           
                           return (
                             <tr key={u.unit_id || idx} className="hover:bg-muh-green/5 transition-colors group">
                                <td className="px-8 py-5 text-center">
                                   <span className="w-6 h-6 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center text-[10px] font-black group-hover:bg-muh-green group-hover:text-white transition-colors">{idx + 1}</span>
                                </td>
                                <td className="px-6 py-5">
                                   <p className="font-bold text-gray-800 group-hover:text-muh-green transition-colors text-sm leading-tight">{u.nama_unit}</p>
                                   <p className="text-[8px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter mt-1 inline-block">ID: {u.u_id || u.unit_id || u.id}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                   <p className="text-[11px] font-mono text-gray-400">Rp {fmt(u.consolidatedPagu)}</p>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex flex-col items-end">
                                      <p className="text-sm font-black text-gray-700 font-mono">Rp {fmt(u.totalPaguProker || 0)}</p>
                                      <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                         <div className="bg-gray-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctRencana)}%` }}></div>
                                      </div>
                                      <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{pctRencana.toFixed(0)}% DARI PAGU</p>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex flex-col items-end">
                                      <p className="text-sm font-black text-orange-600">Rp {fmt(u.totalAnggaran)}</p>
                                      <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                         <div className="bg-orange-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctDiajukan)}%` }}></div>
                                      </div>
                                      <span className="text-[8px] font-black text-orange-400 mt-1 uppercase">{pctDiajukan.toFixed(0)}% DARI RENCANA</span>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex flex-col items-end">
                                      <span className="font-black text-muh-green text-sm">Rp {fmt(u.totalDisetujui || 0)}</span>
                                      <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                         <div className="bg-muh-green h-full transition-all duration-1000" style={{ width: `${Math.min(100, pctCair)}%` }}></div>
                                      </div>
                                      <span className="text-[8px] font-black text-muh-green mt-1 uppercase">{pctCair.toFixed(0)}% DARI AJUAN</span>
                                   </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                   <div className="flex items-center justify-center gap-4">
                                      <div className="text-right border-r border-gray-100 pr-4 min-w-[120px]">
                                         <p className="text-sm font-black text-muh-green">Rp {fmt(u.totalSPJ || 0)}</p>
                                         {u.totalSPJProcess > 0 && (
                                            <p className="text-[9px] font-black text-orange-500 mt-0.5 italic animate-pulse">+ Rp {fmt(u.totalSPJProcess)} (Review)</p>
                                         )}
                                         <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden flex shadow-inner">
                                            <div className="bg-muh-green h-full transition-all duration-1000" style={{ width: `${Math.min(100, spjPct)}%` }}></div>
                                         </div>
                                         <p className="text-[8px] text-gray-300 font-bold tracking-widest uppercase mt-1">{spjPct.toFixed(0)}% LAPOR</p>
                                      </div>
                                      {spjPct >= 80 ? (
                                         <div className="relative group/tool">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-sm border border-emerald-200 animate-in zoom-in duration-300">🛡️</div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[8px] px-2 py-1 rounded hidden group-hover/tool:block whitespace-nowrap z-50 shadow-xl">SISTEM PROTEKSI AKTIF</div>
                                         </div>
                                      ) : (
                                         <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center text-lg border border-orange-100 opacity-30">⏳</div>
                                      )}
                                   </div>
                                </td>
                             </tr>
                           );
                         })
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .p-6 { padding: 0 !important; }
          body { background: white !important; }
          .bg-white { box-shadow: none !important; border: 1px solid #eee !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
      `}</style>



      {/* Monthly Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-base font-bold text-gray-800">Grafik Aktivitas Bulanan (Rp)</h2>
           <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400"></span> Pengajuan</div>
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muh-green"></span> Cair</div>
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span> SPJ</div>
           </div>
        </div>
        
        <div className="h-64 flex items-end gap-1.5 sm:gap-4 pt-4 border-b-2 border-gray-100">
          {(() => {
            if (!data?.monthlyChart) return null;
            const maxVal = Math.max(...data.monthlyChart.map((m: any) => Math.max(m.pengajuan, m.disetujui, m.spj)));
            const safeMax = maxVal > 0 ? maxVal : 1;
            const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

            return data.monthlyChart.map((m: any, idx: number) => {
               const pPct = (m.pengajuan / safeMax) * 100;
               const dPct = (m.disetujui / safeMax) * 100;
               const sPct = (m.spj / safeMax) * 100;
               return (
                 <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full mx-auto max-w-[40px] relative">
                       {/* Tooltip on hover */}
                       <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max max-w-[120px] text-center whitespace-normal">
                          <p className="font-bold border-b border-gray-600 pb-1 mb-1">{MONTHS[idx]}</p>
                          <p className="text-blue-300">Pengajuan: {fmt(m.pengajuan)}</p>
                          <p className="text-emerald-300">Cair: {fmt(m.disetujui)}</p>
                          <p className="text-orange-300">SPJ: {fmt(m.spj)}</p>
                       </div>
                       
                       <div className="w-1/3 bg-blue-400 rounded-t-sm transition-all duration-500 hover:brightness-110" style={{ height: `${Math.max(1, pPct)}%` }}></div>
                       <div className="w-1/3 bg-muh-green rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-[0_0_8px_rgba(4,120,87,0.3)]" style={{ height: `${Math.max(1, dPct)}%` }}></div>
                       <div className="w-1/3 bg-orange-400 rounded-t-sm transition-all duration-500 hover:brightness-110" style={{ height: `${Math.max(1, sPct)}%` }}></div>
                    </div>
                    <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase mt-2">{MONTHS[idx]}</p>
                 </div>
               );
            });
          })()}
        </div>
      </div>

      <div className="space-y-6">
        {/* Monitoring Proker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-800">Monitoring Program Kerja Tahunan</h2>
            <span className="text-xs text-gray-400">{data?.prokerSummary.length ?? 0} program</span>
          </div>
          <div>
            {!data?.prokerSummary.length ? (
              <p className="p-6 text-sm text-gray-500">Belum ada data Program Kerja Tahunan.</p>
            ) : (() => {
              // Group proker by unit
              const grouped: Record<string, { unit_nama: string; items: typeof data.prokerSummary }> = {};
              data.prokerSummary.forEach((pk: any) => {
                const key = String(pk.unit_id || 'lainnya');
                if (!grouped[key]) grouped[key] = { unit_nama: pk.unit_nama || 'Unit Lain', items: [] };
                grouped[key].items.push(pk);
              });
              const groupKeys = Object.keys(grouped);
              return (
                <div className="divide-y divide-gray-100">
                  {groupKeys.map((key) => {
                    const grp = grouped[key];
                    const isOpen = openUnits.has(key);
                    const totalAnggaran = grp.items.reduce((s: number, pk: any) => s + pk.anggaran, 0);
                    const totalSisa = grp.items.reduce((s: number, pk: any) => s + pk.sisa, 0);
                    const totalPengajuan = grp.items.reduce((s: number, pk: any) => s + pk.diajukan, 0);
                    const totalDisetujui = grp.items.reduce((s: number, pk: any) => s + pk.disetujui, 0);
                    
                    const pctPengajuan = totalAnggaran > 0 ? Math.min(100, (totalPengajuan / totalAnggaran) * 100) : 0;
                    const pctDisetujui = totalAnggaran > 0 ? Math.min(100, (totalDisetujui / totalAnggaran) * 100) : 0;
                    const pctPending = pctPengajuan - pctDisetujui;

                    return (
                      <div key={key} className="bg-white">
                        {/* Unit Header - Clickable to expand */}
                        <div className="w-full flex justify-between items-stretch bg-gray-50 hover:bg-green-50/30 transition border-y border-gray-100/50 relative overflow-hidden">
                          <button
                            onClick={() => setOpenUnits(prev => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key); else next.add(key);
                              return next;
                            })}
                            className="flex items-center gap-3 px-5 py-4 flex-1 text-left"
                          >
                            <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                            <div>
                               <p className="font-black text-sm text-gray-800">{grp.unit_nama}</p>
                               <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">{grp.items.length} Program Kerja</span>
                            </div>
                          </button>
                          
                          <div className="flex flex-col justify-center px-5 py-2 min-w-[300px] bg-white border-l border-gray-100">
                             <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                               <span>Pagu Proker: <span className="text-gray-800">Rp {fmt(totalAnggaran)}</span></span>
                               <span>Sisa: <span className={totalSisa <= 0 ? 'text-red-500' : 'text-emerald-500'}>Rp {fmt(totalSisa)}</span></span>
                             </div>
                             
                             {/* Mini Grafik Subtotal */}
                             <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                                <div className="h-full bg-emerald-500 relative" style={{ width: `${pctDisetujui}%` }}>
                                   <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                                </div>
                                <div className="h-full bg-yellow-400/60" style={{ width: `${Math.max(0, pctPending)}%` }}></div>
                             </div>
                             
                             <div className="flex justify-between text-[9px] font-bold text-gray-500 mt-1 uppercase">
                                <span>✔ Cair: Rp {fmt(totalDisetujui)}</span>
                                <span>⏳ Menunggu: Rp {fmt(totalPengajuan - totalDisetujui)}</span>
                             </div>
                          </div>
                        </div>
                        {/* Kegiatan rows - default collapsed */}
                        {isOpen && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50/70 text-gray-400 uppercase font-black tracking-wider border-y border-gray-100">
                                <tr>
                                  <th className="px-6 py-2 text-left">Nama Kegiatan</th>
                                  <th className="px-4 py-2 text-right">Anggaran</th>
                                  <th className="px-4 py-2 text-right text-gray-400">Pengajuan</th>
                                  <th className="px-4 py-2 text-right text-muh-green">Disetujui</th>
                                  <th className="px-4 py-2 text-right text-orange-600">Diambil</th>
                                  <th className="px-4 py-2 text-right text-blue-600">SPJ</th>
                                  <th className="px-4 py-2 text-right font-black">Sisa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {grp.items.map((pk: any) => (
                                  <tr key={pk.id} className="hover:bg-gray-50/70 transition">
                                    <td className="px-6 py-2.5 font-semibold text-gray-700">{pk.nama_kegiatan}</td>
                                    <td className="px-4 py-2.5 text-right font-mono">Rp {fmt(pk.anggaran)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-400">Rp {fmt(pk.diajukan)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muh-green font-bold">Rp {fmt(pk.disetujui)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-orange-600 font-bold">Rp {fmt(pk.diambil)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-blue-600 font-bold">Rp {fmt(pk.dilaporkan)}</td>
                                    <td className={`px-4 py-2.5 text-right font-mono font-black ${pk.sisa < (pk.anggaran * 0.1) ? 'text-red-600' : 'text-muh-green'}`}>
                                      Rp {fmt(pk.sisa)}
                                    </td>
                                  </tr>
                                ))}
                                {/* Subtotal Row */}
                                <tr className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-200">
                                  <td className="px-6 py-3 text-left uppercase tracking-widest text-[10px]">TOTAL {grp.unit_nama}</td>
                                  <td className="px-4 py-3 text-right font-mono">Rp {fmt(totalAnggaran)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-600">Rp {fmt(totalPengajuan)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-muh-green">Rp {fmt(totalDisetujui)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-orange-600">Rp {fmt(grp.items.reduce((s: number, pk: any) => s + pk.diambil, 0))}</td>
                                  <td className="px-4 py-3 text-right font-mono text-blue-600">Rp {fmt(grp.items.reduce((s: number, pk: any) => s + pk.dilaporkan, 0))}</td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-900">Rp {fmt(totalSisa)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>



        {/* Aktivitas Terbaru */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Aktivitas Usulan Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {!data?.recentProposals.length ? (
              <p className="p-6 text-sm text-gray-500">Belum ada aktivitas pengajuan.</p>
            ) : data?.recentProposals.map((p: any) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition">
                <div className="h-9 w-9 rounded-full bg-muh-green/10 flex items-center justify-center text-muh-green font-bold text-sm flex-shrink-0">
                   {p.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{p.judul}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.unit.nama_unit} · {new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(p.status_terakhir)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
