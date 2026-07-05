import { gmail_v1, google } from 'googleapis';

/**
 * Constructs an OR-style search query for Gmail from a comma-separated list of sender emails.
 */
export function buildGmailQuery(
  senderEmails: string[],
  afterDate?: Date,
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
    targetDate.setDate(1); // First day of the current month
    targetDate.setHours(0, 0, 0, 0);
  }

  const epoch = Math.floor(targetDate.getTime() / 1000);

  return `${fromQuery} after:${epoch}`;
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
): Promise<{ body: string; from: string } | null> {
  try {
    const messageResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = messageResponse.data.payload;
    const body = parseEmailBody(payload);

    // Extract From header
    const headers = payload?.headers || [];
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from');
    const from = fromHeader?.value || '';

    return { body, from };
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
  afterDate?: Date,
): Promise<{ id: string; body: string; from: string }[]> {
  if (senderEmails.length === 0) return [];

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: providerToken });

  const gmail = google.gmail({ version: 'v1', auth });
  const query = buildGmailQuery(senderEmails, afterDate);
  const limit = process.env.MAX_EMAIL_RESULTS
    ? parseInt(process.env.MAX_EMAIL_RESULTS, 10)
    : undefined;

  console.log({ query });

  try {
    let allMessages: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const fetchCount = limit
        ? Math.min(500, limit - allMessages.length)
        : 500;
      if (limit && fetchCount <= 0) break;

      const listResponse: any = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: fetchCount,
        pageToken,
      });

      if (listResponse.data.messages) {
        allMessages = allMessages.concat(listResponse.data.messages);
      }

      pageToken = listResponse.data.nextPageToken || undefined;
    } while (pageToken && (!limit || allMessages.length < limit));

    if (limit && allMessages.length > limit) {
      allMessages = allMessages.slice(0, limit);
    }

    console.log({ fetchedEmails: allMessages.length });

    const emailContents: { id: string; body: string; from: string }[] = [];

    for (const msg of allMessages) {
      if (msg.id) {
        const content = await fetchEmailContent(gmail, msg.id);
        if (content && content.body) {
          emailContents.push({
            id: msg.id,
            body: content.body,
            from: content.from,
          });
        }
      }
    }

    return emailContents;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}
