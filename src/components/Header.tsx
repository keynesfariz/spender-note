'use client';

import { LogOut, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/wallets', label: 'Wallets' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/categories', label: 'Categories' },
    // { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto grid h-16 max-w-6xl grid-cols-2 items-center px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-sm font-bold">
          BM.
        </Link>
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'hover:text-foreground/80 transition-colors',
                pathname === link.href
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/60',
              )}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/settings"
            className={cn(
              'hover:text-foreground/80 mr-2 transition-colors',
              pathname === '/settings'
                ? 'text-foreground font-semibold'
                : 'text-foreground/60',
            )}>
            <Settings className="size-4.5" />
          </Link>
          <Separator orientation="vertical" />
          <form action="/auth/signout" method="POST">
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
