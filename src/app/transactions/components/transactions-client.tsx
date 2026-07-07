'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TransactionRow } from '../columns';
import { TransactionsList } from './transactions-list';
import { TransactionsForm } from './transactions-form';
import { TransactionsDeleteDialog } from './transactions-delete-dialog';

interface TransactionsClientProps {
  data: TransactionRow[];
  pageCount: number;
  currency: string;
  categories: { id: string; name: string }[];
  wallets: { id: string; label: string }[];
}

export function TransactionsClient({
  data,
  pageCount,
  currency,
  categories,
  wallets,
}: TransactionsClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<TransactionRow | undefined>();

  const handleEdit = (tx: TransactionRow) => {
    setSelectedEntity(tx);
    setFormOpen(true);
  };

  const handleDelete = (tx: TransactionRow) => {
    setSelectedEntity(tx);
    setDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEntity(undefined);
    setFormOpen(true);
  };

  return (
    <PageLayout
      metadata={{
        title: 'Transactions',
        description:
          'Track, audit, and categorize your capital flow across multiple institutional wallets and accounts.',
      }}
      actions={
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 size-4" />
          Add Transaction
        </Button>
      }>
      <TransactionsList
        data={data}
        pageCount={pageCount}
        currency={currency}
        categories={categories}
        wallets={wallets}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <TransactionsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedEntity}
        categories={categories}
        wallets={wallets}
      />
      <TransactionsDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        transaction={selectedEntity}
      />
    </PageLayout>
  );
}
