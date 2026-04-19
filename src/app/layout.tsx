import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIMMUDA Kota Jogja',
  description: 'Sistem Informasi Manajemen Muhammadiyah Daerah Kota Jogja',
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
