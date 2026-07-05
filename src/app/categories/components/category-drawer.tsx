'use client';

import * as React from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { CategoryForm, CategoryData } from './category-form';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? 'right' : 'down'}>
      <DrawerContent
        className={
          isDesktop
            ? 'right-0 mt-0 ml-auto flex h-full w-96 flex-col rounded-none rounded-l-[min(var(--radius-4xl),24px)] border-l'
            : 'mt-24 h-[85vh]'
        }>
        <DrawerHeader>
          <DrawerTitle>
            {initialData ? 'Edit Category' : 'Create Category'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <CategoryForm
            initialData={initialData}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
