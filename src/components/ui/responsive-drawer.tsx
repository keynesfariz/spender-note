'use client';

import * as React from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: ResponsiveDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? 'right' : 'down'}>
      <DrawerContent className="mx-auto max-w-md md:mr-2 md:max-w-96">
        <div className="space-y-6 md:flex md:flex-col md:p-1">
          <DrawerHeader className="md:gap-1">
            <DrawerTitle className="text-lg">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-balance">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className={cn('grow overflow-y-scroll px-4', contentClassName)}>
            {children}
          </div>
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
