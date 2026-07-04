/* eslint-disable @typescript-eslint/no-explicit-any */
self.onmessage = async (e: MessageEvent) => {
  if (e.data.type === 'START_SYNC') {
    try {
      // 1. Fetch emails (or use cache)
      let emails = e.data.cachedEmails || [];

      if (emails.length === 0) {
        self.postMessage({ type: 'PROGRESS', message: 'Fetching emails...' });

        const sendersResponse = await fetch('/api/sync/get-senders');
        if (!sendersResponse.ok) {
          const errData = await sendersResponse.json().catch(() => ({}));
          throw new Error(
            errData.error ||
              `Failed to fetch senders: ${sendersResponse.statusText}`,
          );
        }
        const sendersData = await sendersResponse.json();

        const listResponse = await fetch('/api/sync/fetch-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ senderEmails: sendersData.senderEmails }),
        });

        if (!listResponse.ok) {
          throw new Error(`Failed to fetch emails: ${listResponse.statusText}`);
        }

        const listData = await listResponse.json();

        if (!listData.emails || listData.emails.length === 0) {
          self.postMessage({
            type: 'SUCCESS',
            message: listData.message || 'No new emails found.',
          });
          return;
        }

        emails = listData.emails;

        // Send back to main thread to cache in localStorage
        self.postMessage({ type: 'FETCHED_EMAILS', emails });
      } else {
        self.postMessage({
          type: 'PROGRESS',
          message: 'Using cached emails...',
        });
      }

      let successCount = 0;

      // 2. Process each email sequentially
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        self.postMessage({
          type: 'PROGRESS',
          message: `Processing email ${i + 1} of ${emails.length}...`,
        });

        const processResponse = await fetch('/api/sync/process-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(email),
        });

        if (processResponse.ok) {
          successCount++;
          self.postMessage({
            type: 'PROCESSED_EMAIL_SUCCESS',
            emailId: email.id,
          });
        } else {
          console.error(`Failed to process email ${email.id}`);
        }
      }

      self.postMessage({
        type: 'SUCCESS',
        message: `Sync complete. Processed ${successCount} emails.`,
      });
    } catch (error: any) {
      self.postMessage({
        type: 'ERROR',
        message: error.message || 'An error occurred during sync.',
      });
    }
  }
};
