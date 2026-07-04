import { gmail_v1, google } from 'googleapis';

/**
 * Constructs an OR-style search query for Gmail from a comma-separated list of sender emails.
 */
export function buildGmailQuery(senderFilter: string): string {
  const senders = senderFilter
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const fromQuery = senders.length > 1
    ? `{${senders.map((s) => `from:${s}`).join(' ')}}`
    : `from:${senders[0] || ''}`;

  return `${fromQuery} newer_than:2d`;
}

/**
 * Extracts and decodes the plain text body from a Gmail message payload.
 */
export function parseEmailBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return '';

  if (payload.parts) {
    const plainTextPart = payload.parts.find((part) => part.mimeType === 'text/plain') || payload.parts[0];
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
export async function fetchEmailContent(gmail: gmail_v1.Gmail, messageId: string): Promise<string> {
  try {
    const messageResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = messageResponse.data.payload;
    return parseEmailBody(payload);
  } catch (error) {
    console.error(`Failed to fetch content for message ID ${messageId}:`, error);
    return '';
  }
}

/**
 * Fetches recent email messages matching the configured sender filter.
 */
export async function fetchRecentEmails(
  providerToken: string,
  senderFilter: string
): Promise<{ id: string; body: string }[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: providerToken });

  const gmail = google.gmail({ version: 'v1', auth });
  const query = buildGmailQuery(senderFilter);
  const maxResults: number = process.env.MAX_EMAIL_RESULTS ? parseInt(process.env.MAX_EMAIL_RESULTS) : 5

  try {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const messages = listResponse.data.messages || [];
    const emailContents: { id: string; body: string }[] = [];

    for (const msg of messages) {
      if (msg.id) {
        const body = await fetchEmailContent(gmail, msg.id);
        if (body) {
          emailContents.push({ id: msg.id, body });
        }
      }
    }

    return emailContents;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}
