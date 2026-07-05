'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { Metadata } from 'next';

import { WalletDeleteDialog } from './wallet-delete-dialog';
import { WalletMergeDialog } from './wallet-merge-dialog';
import { deleteWallet, mergeWallets } from '../actions';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Wallet } from '@/lib/sync-service';
import { WalletList } from './wallet-list';
import { WalletForm } from './wallet-form';

export function WalletsClient({
  initialWallets,
  currency,
  metadata,
}: {
  initialWallets: Wallet[];
  currency: string;
  metadata: Metadata;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(
    undefined,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleCreate = () => {
    setSelectedWallet(undefined);
    setFormOpen(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setFormOpen(true);
  };

  const handleDeleteClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWallet) return;
    try {
      setIsDeleting(true);
      await deleteWallet(selectedWallet.id);
      toast.success('Wallet deleted successfully');
      setDeleteOpen(false);
    } catch {
      toast.error('Failed to delete wallet');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMergeClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setMergeOpen(true);
  };

  const handleMergeConfirm = async (targetWalletId: string) => {
    if (!selectedWallet) return;
    try {
      setIsMerging(true);
      await mergeWallets(selectedWallet.id, targetWalletId);
      toast.success('Wallets merged successfully');
      setMergeOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to merge wallets';
      toast.error(message);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <PageLayout
      metadata={metadata}
      actions={
        <Button onClick={handleCreate}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Wallet
        </Button>
      }>
      <WalletList
        wallets={initialWallets}
        currency={currency}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onMerge={handleMergeClick}
      />

      <WalletForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedWallet}
      />

      <WalletDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      <WalletMergeDialog
        key={selectedWallet ? `${selectedWallet.id}-${mergeOpen}` : 'none'}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        wallet={selectedWallet}
        allWallets={initialWallets}
        isMerging={isMerging}
        onConfirm={handleMergeConfirm}
      />
    </PageLayout>
  );
}
