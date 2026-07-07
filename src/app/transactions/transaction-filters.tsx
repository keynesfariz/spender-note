'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';

import type { DateRange } from 'react-day-picker';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
}

export function TransactionFilters({
  categories,
  wallets,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryItems = [
    { value: 'all', label: 'All Categories' },
    { value: 'NULL', label: 'Uncategorized' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const walletItems = [
    { value: 'all', label: 'All Wallets' },
    ...wallets.map((w) => ({ value: w.id, label: w.label })),
  ];

  const form = useForm({
    defaultValues: {
      remark: searchParams.get('remark') || '',
      category: searchParams.get('category') || 'all',
      wallet: searchParams.get('wallet') || 'all',
      minAmount: searchParams.get('minAmount') || '',
      maxAmount: searchParams.get('maxAmount') || '',
      dateRange: {
        from: searchParams.get('dateFrom')
          ? new Date(searchParams.get('dateFrom')!)
          : undefined,
        to: searchParams.get('dateTo')
          ? new Date(searchParams.get('dateTo')!)
          : undefined,
      } as DateRange | undefined,
    },
    onSubmit: async ({ value }) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set('page', '1');

      if (value.remark) params.set('remark', value.remark);
      else params.delete('remark');

      if (value.category && value.category !== 'all')
        params.set('category', value.category);
      else params.delete('category');

      if (value.wallet && value.wallet !== 'all')
        params.set('wallet', value.wallet);
      else params.delete('wallet');

      if (value.minAmount) params.set('minAmount', value.minAmount);
      else params.delete('minAmount');

      if (value.maxAmount) params.set('maxAmount', value.maxAmount);
      else params.delete('maxAmount');

      if (value.dateRange?.from)
        params.set('dateFrom', format(value.dateRange.from, 'yyyy-MM-dd'));
      else params.delete('dateFrom');

      if (value.dateRange?.to)
        params.set('dateTo', format(value.dateRange.to, 'yyyy-MM-dd'));
      else params.delete('dateTo');

      router.push(`${pathname}?${params.toString()}`);
    },
  });

  const clearFilters = () => {
    form.reset({
      remark: '',
      category: 'all',
      wallet: 'all',
      minAmount: '',
      maxAmount: '',
      dateRange: undefined,
    });

    // Submitting the empty form to clear URL state
    setTimeout(() => form.handleSubmit(), 0);
  };

  return (
    <div className="bg-card text-card-foreground rounded-md border p-4 shadow-sm">
      <h3 className="mb-4 leading-none font-semibold tracking-tight">
        Filters
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <form.Field name="remark">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="remark">Search Remark</Label>
                <Input
                  id="remark"
                  placeholder="e.g. Coffee"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="category">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val || 'all')}
                  items={categoryItems}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="wallet">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val || 'all')}
                  items={walletItems}>
                  <SelectTrigger id="wallet" className="w-full">
                    <SelectValue placeholder="All Wallets" />
                  </SelectTrigger>
                  <SelectContent>
                    {walletItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-2 space-y-2">
            <form.Field name="minAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amt</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="maxAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amt</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="dateRange">
            {(field) => (
              <div className="space-y-2 lg:col-span-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.state.value && 'text-muted-foreground',
                        )}>
                        <CalendarIcon
                          className="size-4"
                          data-icon="inline-start"
                        />
                        {field.state.value?.from ? (
                          field.state.value.to ? (
                            <>
                              {format(field.state.value.from, 'LLL dd, y')} -{' '}
                              {format(field.state.value.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(field.state.value.from, 'LLL dd, y')
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={field.state.value?.from}
                      selected={field.state.value}
                      onSelect={(range) => field.handleChange(range)}
                      numberOfMonths={2}
                      disabled={{ after: addDays(new Date(), 1) }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </form.Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button type="submit">Apply Filters</Button>
        </div>
      </form>
    </div>
  );
}
