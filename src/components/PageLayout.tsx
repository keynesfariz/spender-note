import { Metadata } from 'next';

import { Header } from './Header';

interface PageLayoutProps {
  metadata: Metadata;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageLayout({ metadata, children, actions }: PageLayoutProps) {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl flex-1 space-y-8 p-6">
        <div className="space-y-3 md:flex md:items-start md:justify-between">
          <div>
            {metadata.title && (
              <h1 className="text-3xl font-bold">{`${metadata.title}`}</h1>
            )}
            {metadata.description && <h2>{`${metadata.description}`}</h2>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </main>
    </>
  );
}
