'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/wallets', label: 'Wallets' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/categories', label: 'Categories' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-sm font-bold">
          BM.
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
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
        <div className="flex items-center">
          <form action="/auth/signout" method="POST">
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
