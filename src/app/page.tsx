import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">SI Anggaran - Muhammadiyah</h1>
        <Link 
          href="/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all"
        >
          Masuk ke Aplikasi
        </Link>
      </div>
    </div>
  );
}
