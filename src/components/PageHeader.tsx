import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { AddWalletForm } from '@/app/wallets/add-wallet-form';
import { SyncButton } from '@/components/SyncButton';
import { Button } from '@/components/ui/button';

export function PageHeader() {
  const pathname = usePathname();

  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/wallets': 'Manage Wallets',
    '/transactions': 'Recent Transactions',
    '/categories': 'Categories',
    '/settings': 'Settings',
  };

  const title = titleMap[pathname];

  if (!title) return null;

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <div className="flex space-x-2">
        {pathname === '/' && (
          <>
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <SyncButton />
          </>
        )}
        {pathname === '/wallets' && <AddWalletForm />}
      </div>
    </div>
  );
}
