import type { Metadata } from 'next';

import { CategoriesClient } from './components/categories-client';
import { getCategories } from './actions';

export const metadata: Metadata = {
  title: 'Manage Categories',
  description: 'Manage your spending buckets.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <CategoriesClient initialCategories={categories} metadata={metadata} />
  );
}
