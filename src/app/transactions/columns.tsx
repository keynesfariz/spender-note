'use client';

import { ArrowDownRight, ArrowUpDown, ArrowUpRight } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

const DateCell = ({ value }: { value: any }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!value) return <span>N/A</span>;
  const date = new Date(value);
  if (isNaN(date.getTime())) return <span>Invalid Date</span>;

  if (!mounted) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return <span suppressHydrationWarning>{`${month}/${day}/${year}`}</span>;
  }

  return <span>{date.toLocaleDateString()}</span>;
};

export type TransactionRow = {
  id: string;
  amount: string;
  type: string;
  category: string;
  date: Date;
  remark: string | null;
  walletLabel: string | null;
};

export const getColumns = (currency: string): ColumnDef<TransactionRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="data-[state=open]:bg-accent -ml-4 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Date
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => <DateCell value={row.getValue('date')} />,
  },
  {
    accessorKey: 'remark',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="data-[state=open]:bg-accent -ml-4 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Remark / Merchant
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const remark = row.getValue('remark') as string | null;
      return (
        <div
          className="max-w-50 truncate font-medium"
          title={remark || undefined}>
          {remark || 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="data-[state=open]:bg-accent -ml-4 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Category
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'walletLabel',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="data-[state=open]:bg-accent -ml-4 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Wallet
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('walletLabel') || 'Unknown'}</div>,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            className="data-[state=open]:bg-accent -mr-4 h-8 justify-end"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === 'asc')
            }>
            Amount
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const type = row.original.type;

      return (
        <div className="flex items-center justify-end text-right font-semibold">
          {type === 'expense' ? (
            <span className="flex items-center text-red-500">
              <ArrowDownRight className="mr-1 size-4" />
              {formatCurrency(amount, currency)}
            </span>
          ) : (
            <span className="flex items-center text-green-500">
              <ArrowUpRight className="mr-1 size-4" />
              {formatCurrency(amount, currency)}
            </span>
          )}
        </div>
      );
    },
  },
];
