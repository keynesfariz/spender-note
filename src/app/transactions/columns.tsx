'use client';

import { ArrowDownRight, ArrowUpRight, ArrowUpDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

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
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="data-[state=open]:bg-accent -ml-4 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <div>{date.toLocaleDateString()}</div>;
    },
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('remark') || 'N/A'}</div>
    ),
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
              <ArrowDownRight className="mr-1 h-4 w-4" />
              {formatCurrency(amount, currency)}
            </span>
          ) : (
            <span className="flex items-center text-green-500">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {formatCurrency(amount, currency)}
            </span>
          )}
        </div>
      );
    },
  },
];
