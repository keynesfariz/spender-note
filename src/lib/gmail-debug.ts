import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

export interface DebugEmail {
  id: string;
  body: string;
  from: string;
  date: string;
}

/**
 * Appends new fetched emails to debug/emails.json asynchronously in the background.
 */
export async function logEmailsForDebugging(
  emails: DebugEmail[],
): Promise<void> {
  if (process.env.ENABLE_EMAIL_DEBUG !== 'true') {
    return;
  }

  try {
    const debugDir = path.join(process.cwd(), 'debug');
    // mkdir with recursive: true is safe to call even if the directory exists
    await fs.mkdir(debugDir, { recursive: true });

    const filePath = path.join(debugDir, 'emails.json');
    let existingEmails: DebugEmail[] = [];

    if (existsSync(filePath)) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        existingEmails = JSON.parse(fileContent);
        if (!Array.isArray(existingEmails)) {
          existingEmails = [];
        }
      } catch (parseErr) {
        console.warn(
          'Failed to parse existing debug emails, resetting:',
          parseErr,
        );
        existingEmails = [];
      }
    }

    // Add only unique emails by ID to keep the debug file clean
    let addedCount = 0;
    for (const email of emails) {
      if (!existingEmails.some((e) => e.id === email.id)) {
        existingEmails.push(email);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await fs.writeFile(
        filePath,
        JSON.stringify(existingEmails, null, 2),
        'utf-8',
      );
      console.log(
        `Successfully updated debug emails in ${filePath} (added: ${addedCount}, total: ${existingEmails.length})`,
      );
    } else {
      console.log(
        `No new unique emails to append (total: ${existingEmails.length})`,
      );
    }
  } catch (writeErr) {
    console.error('Failed to write debug emails file:', writeErr);
  }
}
