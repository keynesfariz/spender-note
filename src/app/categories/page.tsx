import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryList } from './components/category-list';
import { PageLayout } from '@/components/PageLayout';
import { getCategories } from './actions';

export const metadata: Metadata = {
  title: 'Manage Categories',
  description: 'Manage your spending buckets.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <PageLayout metadata={metadata}>
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList initialCategories={categories} />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
