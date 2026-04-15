"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.username) setUser(data);
      });
  }, []);
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const hasPermission = (path: string) => {
    if (!user) return false;
    // Super Admin otomatis bisa akses semua menu
    if (user.role?.nama === 'Super Admin') return true;
    
    if (path === '/dashboard') return true;
    if (!user.permissions) return false;
    
    const p = user.permissions.find((perm: any) => perm.menu.path === path);
    return p ? p.can_read : false;
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-muh-green-dark text-white flex flex-col h-screen shadow-xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex-shrink-0
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 bg-white rounded-full flex items-center justify-center font-bold text-muh-green-dark text-xl">M</div>
            <div>
              <h2 className="font-bold text-base tracking-wide leading-tight">SI Anggaran</h2>
              <p className="text-[10px] text-muh-green-light font-bold uppercase tracking-widest">Muhammadiyah</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 mt-2">Main Menu</p>
          {[
            { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { path: '/dashboard/proker', label: 'Program Kerja', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { path: '/dashboard/proposals', label: 'Usulan Anggaran', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { path: '/dashboard/approvals', label: 'Persetujuan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { path: '/dashboard/pertanggungjawaban', label: 'Laporan SPJ', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { path: '/dashboard/pertanggungjawaban/approvals', label: 'Persetujuan SPJ', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { path: '/dashboard/kas', label: 'Buku Kas', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
          ].map((item) => hasPermission(item.path) && (
            <a 
              key={item.path} 
              href={item.path} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group ${
                pathname === item.path ? 'bg-white/15 text-white shadow-lg ring-1 ring-white/20' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${pathname === item.path ? 'text-emerald-400' : 'text-white/40 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </a>
          ))}

          {/* Admin Section */}
          {(hasPermission('/dashboard/units') || hasPermission('/dashboard/users')) && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Settings</p>
              {[
                { path: '/dashboard/master', label: 'Data Master', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
                { path: '/dashboard/pagu', label: 'Pagu Anggaran', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { path: '/dashboard/units', label: 'Manajemen Unit', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                { path: '/dashboard/users', label: 'Manajemen User', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              ].map((item) => hasPermission(item.path) && (
                <a 
                  key={item.path} 
                  href={item.path} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm group ${
                    pathname === item.path ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-emerald-400">
               {user?.nama?.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0">
               <p className="text-sm font-bold truncate">{user?.nama}</p>
               <p className="text-[10px] text-white/40 truncate font-black tracking-wider uppercase">{user?.unit?.nama_unit_pendek || user?.unit?.nama_unit}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
             <div className="flex items-center gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
               <h1 className="text-sm lg:text-base font-black text-gray-800 tracking-tight uppercase">
                 <span className="hidden sm:inline">SI Anggaran</span> Muhammadiyah
               </h1>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="hidden md:block text-right">
                 <p className="text-xs font-black text-gray-900 leading-tight uppercase tracking-wider">{user?.nama}</p>
                 <p className="text-[10px] text-muh-green font-bold italic">{user?.role?.nama}</p>
               </div>
               <div className="h-9 w-9 bg-gray-100 text-muh-green-dark border-2 border-white shadow-sm rounded-full flex items-center justify-center font-black text-xs">
                 {user?.nama?.charAt(0).toUpperCase()}
               </div>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#F9FAFB]">
            {children}
        </div>
      </main>
    </div>
  );
}
