'use client';

import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { Button } from '@/components/ui/button';
import { Wallet } from '@/lib/sync-service';

interface WalletMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: Wallet;
  allWallets: Wallet[];
  isMerging: boolean;
  onConfirm: (targetWalletId: string) => void;
}

export function WalletMergeDialog({
  open,
  onOpenChange,
  wallet,
  allWallets,
  isMerging,
  onConfirm,
}: WalletMergeDialogProps) {
  const [targetWalletId, setTargetWalletId] = useState('');

  if (!wallet) return null;

  const otherWallets = allWallets.filter((w) => w.id !== wallet.id);

  const handleMerge = () => {
    if (!targetWalletId || targetWalletId === 'none') return;
    onConfirm(targetWalletId);
  };

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Merge ${wallet.label}`}
      description="Select another wallet to merge this wallet into. All transactions will be moved to the selected wallet, and this wallet will be deleted. This action cannot be undone."
      contentClassName="grid gap-4"
      footer={
        <>
          <Button
            onClick={handleMerge}
            disabled={
              !targetWalletId || isMerging || targetWalletId === 'none'
            }>
            {isMerging ? 'Merging...' : 'Merge'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}>
            Cancel
          </Button>
        </>
      }>
      <Select
        value={targetWalletId}
        onValueChange={(val) => setTargetWalletId(val || '')}>
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
  );
}
