import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SI Anggaran - Muhammadiyah',
  description: 'Sistem Informasi Pengajuan Anggaran Program Kerja',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
