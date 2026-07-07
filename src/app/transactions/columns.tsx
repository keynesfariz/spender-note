'use client';

import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Edit,
  MoreHorizontal,
  Trash,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useSyncExternalStore } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

const emptySubscribe = () => () => {};

const DateCell = ({ value }: { value: any }) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!value) return <span>N/A</span>;
  const date = new Date(value);
  if (isNaN(date.getTime())) return <span>Invalid Date</span>;

  if (!isMounted) {
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
  categoryId: string | null;
  date: Date;
  remark: string | null;
  walletLabel: string | null;
  walletId: string;
  emailId: string | null;
};

export const getColumns = (
  currency: string,
  onEdit: (tx: TransactionRow) => void,
  onDelete: (tx: TransactionRow) => void,
): ColumnDef<TransactionRow>[] => [
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
          <ArrowUpDown className="size-4" data-icon="inline-end" />
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
          <ArrowUpDown className="size-4" data-icon="inline-end" />
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
          <ArrowUpDown className="size-4" data-icon="inline-end" />
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
          <ArrowUpDown className="size-4" data-icon="inline-end" />
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
            <ArrowUpDown className="size-4" data-icon="inline-end" />
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
  {
    id: 'actions',
    cell: ({ row }) => {
      const tx = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tx)}>
              <Edit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => onDelete(tx)}>
              <Trash className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
