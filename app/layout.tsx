import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Learning With Rizky | Kursus Online & Tryout",
    template: "%s | Learning With Rizky",
  },
  description:
    "Platform belajar online untuk persiapan CPNS, Bahasa Inggris, dan teknologi informasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} dark:bg-gray-900`}>
        {children}
      </body>
    </html>
  );
}
