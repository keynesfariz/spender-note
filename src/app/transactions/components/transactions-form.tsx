'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { createTransaction, updateTransaction } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TransactionRow } from '../columns';

export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      'Amount must be a positive number',
    ),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Date is required'),
  walletId: z.string().min(1, 'Wallet is required'),
  categoryId: z.string().nullable(),
  remark: z.string(),
});

export type TransactionData = z.infer<typeof transactionSchema>;

interface TransactionsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TransactionRow;
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
}

export function TransactionsForm({
  open,
  onOpenChange,
  initialData,
  categories,
  wallets,
}: TransactionsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      amount: initialData?.amount || '',
      type: (initialData?.type as 'income' | 'expense') || 'expense',
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      walletId: initialData?.walletId || '',
      categoryId: initialData?.categoryId || null,
      remark: initialData?.remark || '',
    },
    validators: {
      onSubmit: transactionSchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const payload = {
            ...value,
            date: new Date(value.date),
            categoryId: value.categoryId,
            remark: value.remark || null,
          };

          if (initialData?.id) {
            const res = await updateTransaction(initialData.id, payload);
            if (res.error) throw new Error(res.error);
            toast.success('Transaction updated successfully');
          } else {
            const res = await createTransaction(payload);
            if (res.error) throw new Error(res.error);
            toast.success('Transaction created successfully');
          }
          onOpenChange(false);
        } catch (error: any) {
          toast.error(
            error.message || 'Something went wrong. Please try again.',
          );
        }
      });
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: initialData?.amount || '',
        type: (initialData?.type as 'income' | 'expense') || 'expense',
        date: initialData?.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        walletId: initialData?.walletId || '',
        categoryId: initialData?.categoryId || null,
        remark: initialData?.remark || '',
      });
    }
  }, [open, initialData, form]);

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Edit Transaction' : 'Add Transaction'}
      description={
        initialData ? 'Update transaction details' : 'Enter a new transaction'
      }>
      <form
        id="transaction-form"
        className="space-y-6 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <form.Field
          name="type"
          validators={{ onChange: transactionSchema.shape.type }}>
          {(field) => (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={field.state.value}
                onValueChange={(val: any) => field.handleChange(val)}
                items={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="amount"
          validators={{ onChange: transactionSchema.shape.amount }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Amount</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="0.00"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="date"
          validators={{ onChange: transactionSchema.shape.date }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Date</Label>
              <Input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="walletId"
          validators={{ onChange: transactionSchema.shape.walletId }}>
          {(field) => (
            <div className="space-y-2">
              <Label>Wallet</Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as string)}
                items={wallets.map((w) => ({ value: w.id, label: w.label }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="categoryId"
          validators={{ onChange: transactionSchema.shape.categoryId }}>
          {(field) => (
            <div className="space-y-2">
              <Label>Category (Optional)</Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as string)}
                items={[
                  { value: null, label: 'None' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null as any}>None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="remark"
          validators={{ onChange: transactionSchema.shape.remark }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Remark / Merchant (Optional)</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Grocery"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isPending}
                className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting || isPending}
                className="w-full sm:w-auto">
                {isSubmitting || isPending
                  ? 'Saving...'
                  : initialData
                    ? 'Save Changes'
                    : 'Add Transaction'}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </ResponsiveDrawer>
  );
}
