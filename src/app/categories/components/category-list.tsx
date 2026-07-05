'use client';

import { icons, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';

import { CategoryDrawer } from './category-drawer';
import { Button } from '@/components/ui/button';
import { CategoryData } from './category-form';
import { deleteCategory } from '../actions';
import { cn } from '@/lib/utils';

interface Category extends CategoryData {
  id: string;
  transactionCount: number;
}

export function CategoryList({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<
    Category | undefined
  >(undefined);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this category? Associated transactions will become uncategorized.',
      )
    ) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {initialCategories.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No categories found.
        </p>
      ) : (
        <div className="grid gap-4">
          {initialCategories.map((category) => {
            const LucideIcon =
              (icons[
                category.icon as keyof typeof icons
              ] as React.ElementType) || icons.Circle;
            return (
              <div
                key={category.id}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                <div className="flex items-center space-x-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      category.color,
                      category.color === 'bg-signature-cream'
                        ? 'text-ink'
                        : 'text-white',
                    )}>
                    <LucideIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="leading-none font-medium">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {category.transactionCount} transaction
                      {category.transactionCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}>
                    <Pencil className="text-muted-foreground h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialData={selectedCategory}
      />
    </div>
  );
}
