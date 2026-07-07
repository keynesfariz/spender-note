'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteTransaction } from '../actions';
import { Label } from '@/components/ui/label';
import { TransactionRow } from '../columns';

const IGNORE_EMAIL_PREF_KEY = 'budget_manager_ignore_email_by_default';

interface TransactionsDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionRow;
}

export function TransactionsDeleteDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionsDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [ignoreEmail, setIgnoreEmail] = useState(false);

  useEffect(() => {
    if (open) {
      const savedPref = localStorage.getItem(IGNORE_EMAIL_PREF_KEY);
      if (savedPref !== null) {
        setIgnoreEmail(savedPref === 'true');
      } else {
        setIgnoreEmail(true); // Default to true if no preference
      }
    }
  }, [open]);

  const handleIgnoreChange = (checked: boolean) => {
    setIgnoreEmail(checked);
    localStorage.setItem(IGNORE_EMAIL_PREF_KEY, String(checked));
  };

  const handleConfirm = () => {
    if (!transaction) return;

    startTransition(async () => {
      try {
        const res = await deleteTransaction(
          transaction.id,
          transaction.emailId,
          ignoreEmail,
          transaction.date,
        );

        if (res?.error) throw new Error(res.error);

        toast.success('Transaction deleted successfully');
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete transaction');
      }
    });
  };

  const hasEmail = !!transaction?.emailId;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            transaction.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasEmail && (
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="ignore-email"
              checked={ignoreEmail}
              onCheckedChange={(val) => handleIgnoreChange(!!val)}
              disabled={isPending}
            />
            <Label
              htmlFor="ignore-email"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ignore this email in future syncs
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700">
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
