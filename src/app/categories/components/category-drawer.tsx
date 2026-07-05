'use client';

import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { CategoryData, CategoryForm } from './category-form';

interface CategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CategoryData & { id: string };
}

export function CategoryDrawer({
  open,
  onOpenChange,
  initialData,
}: CategoryDrawerProps) {
  return (
    <ResponsiveDrawer
      title={initialData ? 'Edit Category' : 'Create Category'}
      description={initialData ? 'Update category' : 'Create new category'}
      open={open}
      onOpenChange={onOpenChange}>
      <CategoryForm
        initialData={initialData}
        onSuccess={() => onOpenChange(false)}
      />
    </ResponsiveDrawer>
  );
}
