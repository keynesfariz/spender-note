import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryList } from './components/category-list';
import { getCategories } from './actions';

export const metadata: Metadata = {
  title: 'Categories',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList initialCategories={categories} />
        </CardContent>
      </Card>
    </>
  );
}
