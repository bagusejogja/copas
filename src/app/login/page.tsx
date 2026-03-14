"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1627954153920-5c3b4004cde6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}>
      {/* Overlay to dim the background */}
      <div className="absolute inset-0 bg-muh-green-dark opacity-80 mix-blend-multiply"></div>

      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl relative z-10 border border-gray-100">
        <div>
          {/* Temporary Logo Placeholder */}
          <div className="mx-auto h-24 w-24 rounded-full bg-muh-green flex items-center justify-center shadow-lg border-4 border-white">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 drop-shadow-sm">
            Login Sistem
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            Pengajuan Anggaran Program Kerja
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-muh-green focus:border-muh-green focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-muh-green focus:border-muh-green focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white ${
                loading ? 'bg-muh-green-light cursor-not-allowed' : 'bg-muh-green hover:bg-muh-green-dark shadow-md hover:shadow-lg'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muh-green transition-all duration-200 uppercase tracking-wide`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </div>
        </form>
        
        <div className="pt-4 text-center">
             <p className="text-xs text-gray-500 font-medium">Bantuan: Hubungi Administrator IT</p>
        </div>
      </div>
    </div>
  );
}
