import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { PageLayout } from '@/components/PageLayout';
import { NewParserForm } from './new-parser-form';
import { customParserFlag } from '@/lib/flags';

export const metadata: Metadata = {
  title: 'Create Custom Parser',
};

export default async function NewParserPage() {
  const isEnabled = await customParserFlag();
  if (!isEnabled) {
    notFound();
  }

  return (
    <PageLayout metadata={metadata}>
      <NewParserForm />
    </PageLayout>
  );
}
