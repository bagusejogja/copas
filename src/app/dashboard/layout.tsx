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
    if (!user || !user.permissions) return false;
    // Admin selalu bisa akses "/" di sidebar (Dashboard)
    if (path === '/dashboard') return true;
    
    // Cari permission yang sesuai dengan path
    const p = user.permissions.find((perm: any) => perm.menu.path === path);
    return p ? p.can_read : false;
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar — fixed height, scrollable nav */}
      <aside className="w-64 flex-shrink-0 bg-muh-green-dark text-white flex flex-col h-screen shadow-xl">
        {/* Logo (tidak ikut scroll) */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
          <div className="h-10 w-10 flex-shrink-0 bg-white rounded-full flex items-center justify-center font-bold text-muh-green-dark text-xl">M</div>
          <div>
            <h2 className="font-bold text-base tracking-wide">SI Anggaran</h2>
            <p className="text-xs text-muh-green-light">Muhammadiyah</p>
          </div>
        </div>

        {/* Nav — punya scroll sendiri */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-1 mt-1">Utama</p>
          {hasPermission('/dashboard') && (
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </a>
          )}
          {hasPermission('/dashboard/proker') && (
            <a href="/dashboard/proker" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Program Kerja Tahunan
            </a>
          )}
          {hasPermission('/dashboard/proposals') && (
            <a href="/dashboard/proposals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Usulan Anggaran
            </a>
          )}
          {hasPermission('/dashboard/approvals') && (
            <a href="/dashboard/approvals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Persetujuan (Approval)
            </a>
          )}
          {hasPermission('/dashboard/pertanggungjawaban') && (
            <a href="/dashboard/pertanggungjawaban" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Laporan Pendanaan (LPJ)
            </a>
          )}
          {hasPermission('/dashboard/pertanggungjawaban/approvals') && (
            <a 
              href="/dashboard/pertanggungjawaban/approvals" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                pathname === '/dashboard/pertanggungjawaban/approvals' 
                ? 'bg-white/20 text-emerald-300 font-bold' 
                : 'text-white/80 font-medium hover:bg-white/10 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Persetujuan SPJ
            </a>
          )}
          {hasPermission('/dashboard/kas') && (
            <a href="/dashboard/kas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Buku Kas (Bendahara)
            </a>
          )}

          {(hasPermission('/dashboard/master') || hasPermission('/dashboard/approval-flow')) && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Data Referensi</p>
              {hasPermission('/dashboard/master') && (
                <a href="/dashboard/master" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  Master Data Referensi
                </a>
              )}
              {hasPermission('/dashboard/pagu') && (
                <a href="/dashboard/pagu" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Pagu Anggaran Unit
                </a>
              )}
              {hasPermission('/dashboard/approval-flow') && (
                <a href="/dashboard/approval-flow" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Alur Persetujuan
                </a>
              )}
            </div>
          )}

          {(hasPermission('/dashboard/units') || hasPermission('/dashboard/users') || hasPermission('/dashboard/menus')) && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Administrasi</p>
              {hasPermission('/dashboard/units') && (
                <a href="/dashboard/units" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Manajemen Unit
                </a>
              )}
              {hasPermission('/dashboard/users') && (
                <a href="/dashboard/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Manajemen Pengguna
                </a>
              )}
              {hasPermission('/dashboard/menus') && (
                <a href="/dashboard/menus" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  Hak Akses
                </a>
              )}
              {hasPermission('/dashboard/settings') && (
                <a href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Pengaturan Sistem
                </a>
              )}
            </div>
          )}
        </nav>

        {/* Logout (tidak ikut scroll) */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">{user ? user.nama.charAt(0).toUpperCase() : '?'}</div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.nama || '...'}</p>
              <p className="text-xs text-white/60 truncate">{user?.role?.nama || '-'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium">Keluar / Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content — scroll sendiri */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-lg font-bold text-gray-800">Sistem Informasi Anggaran Muhammadiyah</h1>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">{user ? user.nama : 'Memuat...'}</p>
                <p className="text-xs text-muh-green font-semibold">{user ? user.role?.nama : '-'}</p>
              </div>
              <div className="h-9 w-9 bg-muh-green text-white rounded-full flex items-center justify-center font-bold text-sm">
                {user ? user.nama.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — scroll sendiri, terpisah dari sidebar */}
        <div className="flex-1 overflow-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
