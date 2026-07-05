'use client';

import { useForm } from '@tanstack/react-form';
import { useTransition } from 'react';
import { icons } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';
import { z } from 'zod';

import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { createCategory, updateCategory } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
});

const ICON_NAMES = [
  'House',
  'ShoppingCart',
  'Zap',
  'Car',
  'HeartPulse',
  'Ticket',
  'Utensils',
  'ShoppingBag',
  'GraduationCap',
  'Sparkles',
  'Coffee',
  'Plane',
  'Smartphone',
  'Gift',
  'Dumbbell',
  'Gamepad2',
  'Briefcase',
  'Dog',
  'Baby',
  'Sofa',
  'Wrench',
  'Music',
  'Book',
] as const;

const COLORS = [
  { name: 'Coral', value: 'bg-signature-coral' },
  { name: 'Forest', value: 'bg-signature-forest' },
  { name: 'Cream', value: 'bg-signature-cream' },
  { name: 'Peach', value: 'bg-signature-peach' },
  { name: 'Mint', value: 'bg-signature-mint' },
  { name: 'Yellow', value: 'bg-signature-yellow' },
  { name: 'Mustard', value: 'bg-signature-mustard' },
  { name: 'Info', value: 'bg-info' },
  { name: 'Success', value: 'bg-success' },
  { name: 'Primary', value: 'bg-primary' },
];

export type CategoryData = z.infer<typeof categorySchema>;

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
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      icon: initialData?.icon || 'House',
      color: initialData?.color || 'bg-primary',
    },
    validators: {
      onSubmit: categorySchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          if (initialData?.id) {
            await updateCategory(initialData.id, value);
            toast.success('Category updated successfully');
          } else {
            await createCategory(value);
            toast.success('Category created successfully');
          }
          onOpenChange(false);
        } catch (error) {
          toast.error('Something went wrong. Please try again.');
        }
      });
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        icon: initialData?.icon || 'House',
        color: initialData?.color || 'bg-primary',
      });
    }
  }, [open, initialData, form]);

  return (
    <ResponsiveDrawer
      title={initialData ? 'Edit Category' : 'Create Category'}
      description={initialData ? 'Update category' : 'Create new category'}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              form="category-form"
              disabled={!canSubmit || isSubmitting || isPending}
              className="w-full">
              {isSubmitting || isPending
                ? 'Saving...'
                : initialData
                  ? 'Save Changes'
                  : 'Create Category'}
            </Button>
          )}
        </form.Subscribe>
      }>
      <form
        id="category-form"
        className="space-y-6 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <form.Field
          name="name"
          validators={{
            onChange: categorySchema.shape.name,
          }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Category name"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="icon"
          validators={{
            onChange: categorySchema.shape.icon,
          }}>
          {(field) => (
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_NAMES.map((iconName) => {
                  const isSelected = field.state.value === iconName;
                  const IconComponent =
                    icons[iconName as keyof typeof icons] ||
                    icons.CircleQuestionMark;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => field.handleChange(iconName)}
                      className={cn(
                        'flex cursor-pointer items-center justify-center rounded-lg border p-3 transition-all',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted text-muted-foreground',
                      )}>
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="color"
          validators={{
            onChange: categorySchema.shape.color,
          }}>
          {(field) => (
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => {
                  const isSelected = field.state.value === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      title={color.name}
                      onClick={() => field.handleChange(color.value)}
                      className={cn(
                        'h-8 w-8 cursor-pointer rounded-full border-2 transition-transform',
                        color.value,
                        isSelected
                          ? 'ring-primary scale-110 shadow-sm ring-2'
                          : 'border-transparent hover:scale-105',
                      )}
                    />
                  );
                })}
              </div>
              {field.state.meta.errors ? (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>
      </form>
    </ResponsiveDrawer>
  );
}
