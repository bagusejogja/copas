"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [form, setForm] = useState({ nama: '', nbm: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setForm({
          nama: data?.nama || '',
          nbm: data?.nbm || '',
          password: ''
        });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Profil berhasil diperbaharui! Silakan masuk kembali dengan password baru jika mengubah password.');
        if (form.password) {
            window.location.href = '/login';
        } else {
            router.refresh();
        }
      } else {
        alert(data.message || 'Gagal update profil');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat profil...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-muh-green-dark text-white border-b border-white/10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl font-black text-muh-green-dark">
            {form.nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">Profil Saya</h1>
            <p className="text-white/60 text-sm">Ubah data diri dan password Anda</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
            <input 
              required 
              type="text" 
              value={form.nama} 
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-muh-green focus:bg-white rounded-2xl p-4 font-bold text-gray-800 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nomor Baku Muhammadiyah (NBM)</label>
            <input 
              type="text" 
              value={form.nbm} 
              onChange={e => setForm(f => ({ ...f, nbm: e.target.value }))}
              placeholder="Kosongkan jika tidak ada"
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-muh-green focus:bg-white rounded-2xl p-4 font-bold text-gray-800 transition-all"
            />
          </div>

          <div className="pt-6 border-t border-gray-100">
            <label className="block text-xs font-black text-red-400 uppercase tracking-widest mb-2">Ganti Password</label>
            <p className="text-xs text-gray-500 mb-4 font-medium italic">Kosongkan jika Anda tidak ingin mengubah password.</p>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Ketik password baru rahasia..."
              className="w-full bg-red-50 border-2 border-transparent focus:border-red-400 focus:bg-white rounded-2xl p-4 font-bold text-red-900 transition-all placeholder-red-300"
            />
          </div>

          <div className="pt-6">
             <button disabled={saving} type="submit" className="w-full bg-muh-green text-white font-black text-lg py-4 rounded-2xl hover:bg-muh-green-dark shadow-xl hover:-translate-y-1 transition-all">
                {saving ? '⏳ Sedang Menyimpan...' : '💾 SIMPAN PERUBAHAN'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
