'use client';

import {
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransactionFilters } from './transaction-filters';
import { BulkUpdateDrawer } from './bulk-update-drawer';
import { getColumns, TransactionRow } from './columns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface DataTableProps {
  data: TransactionRow[];
  pageCount: number;
  currency: string;
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
  onEdit: (tx: TransactionRow) => void;
  onDelete: (tx: TransactionRow) => void;
}

export function DataTable({
  data,
  pageCount,
  currency,
  categories,
  wallets,
  onEdit,
  onDelete,
}: DataTableProps) {
  const columns = useMemo(
    () => getColumns(currency, onEdit, onDelete),
    [currency, onEdit, onDelete]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parsing existing params for initial state
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialSortBy = searchParams.get('sortBy') || '';
  const initialSortOrder = searchParams.get('sortOrder') || '';

  const [sorting, setSorting] = useState<SortingState>(
    initialSortBy
      ? [{ id: initialSortBy, desc: initialSortOrder === 'desc' }]
      : [],
  );

  const [rowSelection, setRowSelection] = useState({});
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);

  // Local state for filters moved to TransactionFilters

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex: initialPage - 1,
        pageSize: 25,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // Apply Sorting and Pagination to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    } else {
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    // Keep current filters but update sort
    router.push(`${pathname}?${params.toString()}`);
  }, [sorting]);

  // Handle pagination clicks
  const handlePageChange = (newPageIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (newPageIndex + 1).toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Filter logic moved to TransactionFilters

  return (
    <div className="space-y-4">
      <TransactionFilters categories={categories} wallets={wallets} />

      {/* Action Bar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-muted/50 flex items-center gap-4 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-action"
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
            <Label
              htmlFor="select-all-action"
              className="cursor-pointer text-sm">
              Select All (this page)
            </Label>
          </div>
          <span className="border-border border-l pl-4 text-sm font-medium">
            {Object.keys(rowSelection).length} selected
          </span>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setBulkDrawerOpen(true)}>
              Bulk Update
            </Button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between py-4">
        <div className="text-muted-foreground text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount() || 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(table.getState().pagination.pageIndex - 1)
            }
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(table.getState().pagination.pageIndex + 1)
            }
            disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <BulkUpdateDrawer
        open={bulkDrawerOpen}
        onOpenChange={setBulkDrawerOpen}
        selectedTransactionIds={Object.keys(rowSelection)
          .map((index) => data[parseInt(index, 10)]?.id)
          .filter(Boolean)}
        categories={categories}
        wallets={wallets}
        onSuccess={() => {
          setRowSelection({});
          router.refresh();
        }}
      />
    </div>
  );
}
