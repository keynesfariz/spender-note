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
import { createWallet, updateWallet } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const walletSchema = z.object({
  label: z.string().min(1, 'Wallet name is required'),
  type: z.enum(['debit', 'credit']),
  balance: z.string().min(1, 'Balance is required'),
  creditLimit: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .pipe(z.string().nullable()),
  statementDayOfMonth: z
    .string()
    .transform((val) => {
      if (val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    })
    .pipe(
      z
        .number()
        .min(1, 'Day must be between 1 and 28')
        .max(28, 'Day must be between 1 and 28')
        .nullable(),
    ),
});

export type WalletData = z.infer<typeof walletSchema>;

interface WalletFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    label: string;
    type: string;
    balance: string;
    creditLimit?: string | null;
    statementDayOfMonth?: number | null;
  };
}

export function WalletForm({
  open,
  onOpenChange,
  initialData,
}: WalletFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      label: initialData?.label || '',
      type: (initialData?.type as 'debit' | 'credit') || 'debit',
      balance: initialData?.balance || '0',
      creditLimit: initialData?.creditLimit || '',
      statementDayOfMonth: initialData?.statementDayOfMonth?.toString() || '',
    },
    validators: {
      onSubmit: walletSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = walletSchema.parse(value);
      startTransition(async () => {
        try {
          if (initialData?.id) {
            await updateWallet(initialData.id, parsed);
            toast.success('Wallet updated successfully');
          } else {
            await createWallet(parsed);
            toast.success('Wallet created successfully');
          }
          onOpenChange(false);
          /* eslint-disable @typescript-eslint/no-unused-vars */
        } catch (error) {
          toast.error('Something went wrong. Please try again.');
        }
      });
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: initialData?.label || '',
        type: (initialData?.type as 'debit' | 'credit') || 'debit',
        balance: initialData?.balance || '0',
        creditLimit: initialData?.creditLimit || '',
        statementDayOfMonth: initialData?.statementDayOfMonth?.toString() || '',
      });
    }
  }, [open, initialData, form]);

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Edit Wallet' : 'Create Wallet'}
      description={
        initialData ? 'Update wallet details' : 'Create a new wallet'
      }>
      <form
        id="wallet-form"
        className="space-y-6 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <form.Field
          name="label"
          validators={{
            onChange: walletSchema.shape.label,
          }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Wallet Name</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Chase Checking"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Type</Label>
              <Select
                value={field.state.value}
                onValueChange={(val) =>
                  field.handleChange(val as 'debit' | 'credit')
                }
                items={[
                  { value: 'debit', label: 'Debit / Checking' },
                  { value: 'credit', label: 'Credit Card' },
                ]}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit / Checking</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.type}>
          {(typeValue) => (
            <form.Field
              name="balance"
              validators={{
                onChange: walletSchema.shape.balance,
              }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    {typeValue === 'credit'
                      ? 'Current Debt Balance'
                      : 'Current Balance'}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.01"
                    required
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
          )}
        </form.Subscribe>

        <form.Subscribe selector={(state) => state.values.type}>
          {(typeValue) => {
            if (typeValue === 'credit') {
              return (
                <>
                  <form.Field
                    name="creditLimit"
                    validators={{
                      onChange: walletSchema.shape.creditLimit,
                    }}>
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Credit Limit</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
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
                    name="statementDayOfMonth"
                    validators={{
                      onChange: walletSchema.shape.statementDayOfMonth,
                    }}>
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          Statement Day of Month
                        </Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="1"
                          max="31"
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
                </>
              );
            }
            return null;
          }}
        </form.Subscribe>

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
                    : 'Create Wallet'}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </ResponsiveDrawer>
  );
}
