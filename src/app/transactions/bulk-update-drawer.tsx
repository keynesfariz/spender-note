'use client';

import { toast } from 'sonner';
import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { DrawerClose } from '@/components/ui/drawer';
import { bulkUpdateTransactions } from './actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BulkUpdateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransactionIds: string[];
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
  onSuccess: () => void;
}

export function BulkUpdateDrawer({
  open,
  onOpenChange,
  selectedTransactionIds,
  categories,
  wallets,
  onSuccess,
}: BulkUpdateDrawerProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = React.useState<string>('');

  // Reset state when drawer opens
  React.useEffect(() => {
    if (!open) {
      setSelectedCategoryId('');
      setSelectedWalletId('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleUpdate = async () => {
    if (!selectedCategoryId && !selectedWalletId) {
      toast.error('Please select a category or wallet to update.');
      return;
    }

    setIsSubmitting(true);
    const result = await bulkUpdateTransactions(selectedTransactionIds, {
      categoryId: selectedCategoryId || undefined,
      walletId: selectedWalletId || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Transactions updated successfully.');
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Update Transactions"
      description={`Bulk update category and/or wallet for ${selectedTransactionIds.length} transaction(s).`}
      footer={
        <>
          <Button
            onClick={handleUpdate}
            disabled={
              isSubmitting || (!selectedCategoryId && !selectedWalletId)
            }>
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
          <DrawerClose render={<Button variant="outline">Cancel</Button>} />
        </>
      }>
      {/* Category Select */}
      <div>
        <Label>New Category</Label>
        <Select
          value={selectedCategoryId}
          onValueChange={(val) => setSelectedCategoryId(val || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Leave blank to keep existing categories.
        </p>
      </div>

      {/* Wallet Select */}
      <div className="flex flex-col gap-2">
        <Label>New Wallet</Label>
        <Select
          value={selectedWalletId}
          onValueChange={(val) => setSelectedWalletId(val || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select wallet..." />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.id} value={wallet.id}>
                {wallet.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Leave blank to keep existing wallets.
        </p>
      </div>
    </ResponsiveDrawer>
  );
}
