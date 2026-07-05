import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Budget Manager',
    default: 'Budget Manager',
  },
  description: 'Manage your budget seamlessly.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
      )}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-right" closeButton />
      </body>
    </html>
  );
}
