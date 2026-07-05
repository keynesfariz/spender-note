'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mergeWallets } from './actions';
import { Wallet } from '@/lib/sync-service';
import { toast } from 'sonner';

export function WalletCardActions({
  wallet,
  allWallets,
}: {
  wallet: Wallet;
  allWallets: Wallet[];
}) {
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [targetWalletId, setTargetWalletId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (!targetWalletId) {
      toast.error('Please select a target wallet');
      return;
    }

    try {
      setIsMerging(true);
      await mergeWallets(wallet.id, targetWalletId);
      toast.success('Wallets merged successfully');
      setIsMergeDialogOpen(false);
      setTargetWalletId('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to merge wallets');
    } finally {
      setIsMerging(false);
    }
  };

  const otherWallets = allWallets.filter((w) => w.id !== wallet.id && w.type === wallet.type);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsMergeDialogOpen(true)}
            disabled={otherWallets.length === 0}
          >
            Merge Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDrawer
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        title={`Merge ${wallet.label}`}
        description="Select another wallet to merge this wallet into. All transactions will be moved to the selected wallet, and this wallet will be deleted. This action cannot be undone."
        contentClassName="grid gap-4"
        footer={
          <>
            <Button
              onClick={handleMerge}
              disabled={!targetWalletId || isMerging || targetWalletId === 'none'}
            >
              {isMerging ? 'Merging...' : 'Merge'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsMergeDialogOpen(false)}
              disabled={isMerging}
            >
              Cancel
            </Button>
          </>
        }
      >
        <Select value={targetWalletId} onValueChange={(val) => setTargetWalletId(val || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select target wallet" />
          </SelectTrigger>
          <SelectContent>
            {otherWallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.label}
              </SelectItem>
            ))}
            {otherWallets.length === 0 && (
              <SelectItem value="none" disabled>
                No other wallets available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </ResponsiveDrawer>
    </>
  );
}
