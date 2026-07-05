import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryList } from './components/category-list';
import { getCategories } from './actions';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList initialCategories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
