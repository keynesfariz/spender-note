'use client';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';

import type { Metadata } from 'next';

import { CategoryDeleteDialog } from './category-delete-dialog';
import { Category, CategoryList } from './category-list';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { CategoryForm } from './category-form';
import { deleteCategory } from '../actions';

export function CategoriesClient({
  initialCategories,
  metadata,
}: {
  initialCategories: Category[];
  metadata: Metadata;
}) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<
    Category | undefined
  >(undefined);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    try {
      setIsDeleting(true);
      await deleteCategory(selectedCategory.id);
      toast.success('Category deleted');
      setDeleteOpen(false);
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      metadata={metadata}
      actions={
        <Button onClick={handleCreate}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Category
        </Button>
      }>
      <CategoryList
        categories={initialCategories}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedCategory}
      />

      <CategoryDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  );
}
