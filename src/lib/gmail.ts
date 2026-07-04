import { google } from 'googleapis';

export async function fetchRecentEmails(providerToken: string, senderFilter: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: providerToken });

  const gmail = google.gmail({ version: 'v1', auth });

  // Split by comma and construct OR query for Gmail
  const senders = senderFilter.split(',').map(s => s.trim()).filter(Boolean);
  const fromQuery = senders.length > 1 
    ? `{${senders.map(s => `from:${s}`).join(' ')}}` 
    : `from:${senders[0] || ''}`;

  const query = `${fromQuery} newer_than:2d`;
  
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10,
    });

    const messages = res.data.messages || [];
    const emailContents = [];

    for (const msg of messages) {
      if (msg.id) {
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full', // Need body
        });
        
        let body = '';
        const payload = msgData.data.payload;
        if (payload?.parts) {
          const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts[0];
          if (part && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf8');
          }
        } else if (payload?.body?.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf8');
        }

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
