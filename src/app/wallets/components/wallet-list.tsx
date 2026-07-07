'use client';

import { CreditCard, Wallet as WalletIcon, MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Wallet } from '@/lib/sync-service';

interface WalletListProps {
  wallets: Wallet[];
  currency: string;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onMerge: (wallet: Wallet) => void;
}

export function WalletList({
  wallets: userWallets,
  currency,
  onEdit,
  onDelete,
  onMerge,
}: WalletListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {userWallets.map((w) => (
        <Card key={w.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center text-lg">
              {w.type === 'credit' ? (
                <CreditCard className="mr-2 size-5 text-red-500" />
              ) : (
                <WalletIcon className="mr-2 size-5 text-green-500" />
              )}
              {w.label}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(w)}>
                  Edit Wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMerge(w)}
                  disabled={userWallets.length <= 1}>
                  Merge Wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(w)}
                  className="text-destructive">
                  Delete Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(w.balance), currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
              {w.type === 'credit' ? 'Debt Balance' : 'Available Balance'}
            </p>
            {w.type === 'credit' && (
              <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Limit:</span>
                  <span>
                    {w.creditLimit
                      ? formatCurrency(parseFloat(w.creditLimit), currency)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statement Day:</span>
                  <span>{w.statementDayOfMonth || 'N/A'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {userWallets.length === 0 && (
        <div className="text-muted-foreground col-span-full rounded-lg border border-dashed p-8 text-center">
          You haven&apos;t added any wallets yet. Click the button above to add
          one.
        </div>
      )}
    </div>
  );
}
