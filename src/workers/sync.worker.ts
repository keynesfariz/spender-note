/* eslint-disable @typescript-eslint/no-explicit-any */
self.onmessage = async (e: MessageEvent) => {
  if (e.data.type === 'START_SYNC') {
    try {
      // 1. Fetch emails (or use cache)
      let emails = e.data.cachedEmails || [];
      let nextCursors = e.data.cachedNextCursors || {};

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

        if (listData.nextCursors) {
          nextCursors = listData.nextCursors;
        }

        if (!listData.emails || listData.emails.length === 0) {
          // If no emails, we still might have updated cursors (e.g. empty days were skipped)
          if (Object.keys(nextCursors).length > 0) {
            await fetch('/api/sync/update-cursor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nextCursors }),
            });
          }

          self.postMessage({
            type: 'SUCCESS',
            message: listData.message || 'No new emails found.',
          });
          return;
        }

        emails = listData.emails;

        // Send back to main thread to cache in localStorage
        self.postMessage({ type: 'FETCHED_EMAILS', emails, nextCursors });
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

      // 3. Update the cursor in the database
      if (Object.keys(nextCursors).length > 0) {
        self.postMessage({
          type: 'PROGRESS',
          message: 'Updating sync cursor...',
        });
        const updateCursorRes = await fetch('/api/sync/update-cursor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nextCursors }),
        });

        if (!updateCursorRes.ok) {
          console.error('Failed to update sync cursors in database');
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
