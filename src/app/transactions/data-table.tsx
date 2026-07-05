'use client';

import {
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BulkUpdateDrawer } from './bulk-update-drawer';
import { getColumns, TransactionRow } from './columns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DataTableProps {
  data: TransactionRow[];
  pageCount: number;
  currency: string;
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
}

export function DataTable({
  data,
  pageCount,
  currency,
  categories,
  wallets,
}: DataTableProps) {
  const columns = React.useMemo(() => getColumns(currency), [currency]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parsing existing params for initial state
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialSortBy = searchParams.get('sortBy') || '';
  const initialSortOrder = searchParams.get('sortOrder') || '';

  const [sorting, setSorting] = React.useState<SortingState>(
    initialSortBy
      ? [{ id: initialSortBy, desc: initialSortOrder === 'desc' }]
      : [],
  );

  const [rowSelection, setRowSelection] = React.useState({});
  const [bulkDrawerOpen, setBulkDrawerOpen] = React.useState(false);

  // Local state for filters
  const [remark, setRemark] = React.useState(searchParams.get('remark') || '');
  const [category, setCategory] = React.useState(
    searchParams.get('category') || '',
  );
  const [wallet, setWallet] = React.useState(searchParams.get('wallet') || '');
  const [minAmount, setMinAmount] = React.useState(
    searchParams.get('minAmount') || '',
  );
  const [maxAmount, setMaxAmount] = React.useState(
    searchParams.get('maxAmount') || '',
  );
  const [dateFrom, setDateFrom] = React.useState(
    searchParams.get('dateFrom') || '',
  );
  const [dateTo, setDateTo] = React.useState(searchParams.get('dateTo') || '');

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
  React.useEffect(() => {
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

  // Handle applying filters via button
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 on new filter
    params.set('page', '1');

    if (remark) params.set('remark', remark);
    else params.delete('remark');

    if (category) params.set('category', category);
    else params.delete('category');

    if (wallet) params.set('wallet', wallet);
    else params.delete('wallet');

    if (minAmount) params.set('minAmount', minAmount);
    else params.delete('minAmount');

    if (maxAmount) params.set('maxAmount', maxAmount);
    else params.delete('maxAmount');

    if (dateFrom) params.set('dateFrom', dateFrom);
    else params.delete('dateFrom');

    if (dateTo) params.set('dateTo', dateTo);
    else params.delete('dateTo');

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setRemark('');
    setCategory('');
    setWallet('');
    setMinAmount('');
    setMaxAmount('');
    setDateFrom('');
    setDateTo('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('remark');
    params.delete('category');
    params.delete('wallet');
    params.delete('minAmount');
    params.delete('maxAmount');
    params.delete('dateFrom');
    params.delete('dateTo');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-card text-card-foreground rounded-md border p-4 shadow-sm">
        <h3 className="mb-4 leading-none font-semibold tracking-tight">
          Filters
        </h3>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="remark">Search Remark</Label>
            <Input
              id="remark"
              placeholder="e.g. Coffee"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Food"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet</Label>
            <Input
              id="wallet"
              placeholder="e.g. BCA"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 space-y-2">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amt</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amt</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="0"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 space-y-2 lg:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </div>

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
