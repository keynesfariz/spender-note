import { gmail_v1, google } from 'googleapis';

import { logEmailsForDebugging } from './gmail-debug';
import { cleanEmailBody } from './utils';

/**
 * Constructs an OR-style search query for Gmail from a comma-separated list of sender emails.
 */
export function buildGmailQuery(
  senderEmails: string[],
  afterDate?: Date,
  beforeDate?: Date,
): string {
  const senders = senderEmails.map((s) => s.trim()).filter(Boolean);

  if (senders.length === 0) return '';

  const fromQuery =
    senders.length > 1
      ? `{${senders.map((s) => `from:${s}`).join(' ')}}`
      : `from:${senders[0] || ''}`;

  let targetDate = afterDate;
  if (!targetDate) {
    targetDate = new Date();
    targetDate.setUTCDate(1); // First day of the current month
    targetDate.setUTCHours(0, 0, 0, 0);
  }

  const epochAfter = Math.floor(targetDate.getTime() / 1000);
  let query = `${fromQuery} after:${epochAfter}`;

  if (beforeDate) {
    const epochBefore = Math.floor(beforeDate.getTime() / 1000);
    query += ` before:${epochBefore}`;
  }

  return query;
}

/**
 * Extracts and decodes the plain text body from a Gmail message payload.
 */
export function parseEmailBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return '';

  if (payload.parts) {
    const plainTextPart =
      payload.parts.find((part) => part.mimeType === 'text/plain') ||
      payload.parts[0];
    if (plainTextPart && plainTextPart.body?.data) {
      return Buffer.from(plainTextPart.body.data, 'base64').toString('utf8');
    }
  } else if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  return '';
}

/**
 * Fetches the plain text content of a single email by its message ID.
 */
export async function fetchEmailContent(
  gmail: gmail_v1.Gmail,
  messageId: string,
): Promise<{ body: string; from: string; date: string } | null> {
  try {
    const messageResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = messageResponse.data.payload;
    const rawBody = parseEmailBody(payload);
    const body = cleanEmailBody(rawBody);

    // Extract From header
    const headers = payload?.headers || [];
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from');
    const from = fromHeader?.value || '';

    // Extract Date header
    const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date');
    const date = dateHeader?.value || new Date().toISOString();

    return { body, from, date };
  } catch (error) {
    console.error(
      `Failed to fetch content for message ID ${messageId}:`,
      error,
    );
    return null;
  }
}

/**
 * Fetches recent email messages matching the configured sender filter.
 */
export async function fetchRecentEmails(
  providerToken: string,
  senderEmails: string[],
  syncCursors: Record<string, number>,
): Promise<{
  emails: { id: string; body: string; from: string; date: string }[];
  nextCursors: Record<string, number>;
}> {
  if (senderEmails.length === 0) return { emails: [], nextCursors: {} };

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: providerToken });

  const gmail = google.gmail({ version: 'v1', auth });
  const limit = process.env.MAX_EMAIL_RESULTS
    ? parseInt(process.env.MAX_EMAIL_RESULTS, 10)
    : 200; // Increased default limit

  const nextCursors: Record<string, number> = { ...syncCursors };
  let allMessages: gmail_v1.Schema$Message[] = [];

  try {
    for (const sender of senderEmails) {
      let currentDate: Date;
      if (syncCursors[sender]) {
        currentDate = new Date(syncCursors[sender] * 1000);
      } else {
        currentDate = new Date();
        currentDate.setUTCDate(1); // First day of the current month
        currentDate.setUTCHours(0, 0, 0, 0);
      }

      const now = new Date();
      let senderMessageCount = 0;

      while (currentDate <= now && senderMessageCount < limit) {
        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        nextDate.setUTCHours(0, 0, 0, 0);

        if (nextDate.getTime() <= currentDate.getTime()) {
          nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        }

        const query = buildGmailQuery([sender], currentDate, nextDate);
        console.log({
          query,
          window: `${currentDate.toISOString()} to ${nextDate.toISOString()}`,
        });

        let pageToken: string | undefined = undefined;
        let dayMessages: gmail_v1.Schema$Message[] = [];

        do {
          const listResponse: any = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 500, // Fetch all for this day
            pageToken,
          });

          if (listResponse.data.messages) {
            dayMessages = dayMessages.concat(listResponse.data.messages);
          }

          pageToken = listResponse.data.nextPageToken || undefined;
        } while (pageToken);

        // Reverse dayMessages entirely at the end of the day to maintain perfect chronological order
        if (dayMessages.length > 0) {
          allMessages = allMessages.concat(dayMessages.reverse());
          senderMessageCount += dayMessages.length;
        }

        currentDate = nextDate;
      }

      // Track exactly where we stopped fetching for this sender
      nextCursors[sender] = Math.floor(currentDate.getTime() / 1000);
    }

    console.log({ fetchedEmails: allMessages.length });

    const emailContents: {
      id: string;
      body: string;
      from: string;
      date: string;
    }[] = [];

    // Parallelize fetching content to avoid timeouts
    const chunkSize = 10;
    for (let i = 0; i < allMessages.length; i += chunkSize) {
      const chunk = allMessages.slice(i, i + chunkSize);
      const promises = chunk.map(async (msg) => {
        if (msg.id) {
          const content = await fetchEmailContent(gmail, msg.id);
          if (content && content.body) {
            return {
              id: msg.id,
              body: content.body,
              from: content.from,
              date: content.date,
            };
          }
        }
        return null;
      });

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res) emailContents.push(res);
      }
    }

    // Store emailContents to a dedicated file for debugging in the background
    logEmailsForDebugging(emailContents).catch((err) => {
      console.error('Failed to log emails for debugging in background:', err);
    });

    return { emails: emailContents, nextCursors };
  } catch (error) {
    console.error('Error fetching emails:', error);
    return { emails: [], nextCursors: syncCursors };
  }
}
