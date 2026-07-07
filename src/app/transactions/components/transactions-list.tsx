'use client';

import { TransactionRow } from '../columns';
import { DataTable } from '../data-table';

interface TransactionsListProps {
  data: TransactionRow[];
  pageCount: number;
  currency: string;
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
  onEdit: (tx: TransactionRow) => void;
  onDelete: (tx: TransactionRow) => void;
}

export function TransactionsList(props: TransactionsListProps) {
  return <DataTable {...props} />;
}
