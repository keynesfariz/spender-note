'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cleanEmailBody } from '@/lib/utils';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the web worker
    workerRef.current = new Worker(
      new URL('../workers/sync.worker.ts', import.meta.url),
    );

    workerRef.current.onmessage = (event) => {
      const { type, message, emails } = event.data;
      if (type === 'FETCHED_EMAILS') {
        try {
          const cleanedEmails = emails.map((email: any) => ({
            ...email,
            body: cleanEmailBody(email.body)
          }));
          localStorage.setItem('cached_emails', JSON.stringify(cleanedEmails));
          console.log('Emails cached to localStorage for debugging.', cleanedEmails);
        } catch (error) {
          console.error('Failed to cache emails to localStorage:', error);
        }
      } else if (type === 'PROCESSED_EMAIL_SUCCESS') {
        try {
          const cached = localStorage.getItem('cached_emails');
          if (cached) {
            const parsedEmails = JSON.parse(cached);
            const remainingEmails = parsedEmails.filter(
              (email: any) => email.id !== event.data.emailId,
            );
            localStorage.setItem(
              'cached_emails',
              JSON.stringify(remainingEmails),
            );
            console.log(
              `Email ${event.data.emailId} processed and removed from cache. Remaining: ${remainingEmails.length}`,
            );
          }
        } catch (error) {
          console.error('Failed to update cached emails:', error);
        }
      } else if (type === 'PROGRESS') {
        toast.loading(message, { id: 'sync-progress' });
      } else if (type === 'SUCCESS') {
        toast.success(message, { id: 'sync-progress' });
        setIsSyncing(false);
      } else if (type === 'ERROR') {
        toast.error(message, { id: 'sync-progress' });
        setIsSyncing(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    toast.info(
      'Sync started in the background. You can continue using the app, but please keep this tab open.',
      { id: 'sync-progress' },
    );

    let cachedEmails = [];
    try {
      const cached = localStorage.getItem('cached_emails');
      if (cached) {
        cachedEmails = JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse cached emails', e);
    }

    workerRef.current?.postMessage({ type: 'START_SYNC', cachedEmails });
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}>
      <RefreshCw
        className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
      />
      {isSyncing ? 'Syncing...' : 'Sync Transactions'}
    </Button>
  );
}
