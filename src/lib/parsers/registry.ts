import { and, eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

import { emailParsers } from '@/db/schema';
import { EmailParser } from './types';
import { db } from '@/db';

export async function getAvailableParsers(
  userId?: string,
): Promise<EmailParser[]> {
  const parsersDir = path.join(process.cwd(), 'src', 'lib', 'parsers', 'list');

  if (!fs.existsSync(parsersDir)) {
    return [];
  }

  const files = fs.readdirSync(parsersDir);
  const parsers: EmailParser[] = [];

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const fileName = file.replace(/\.(ts|js)$/, '');

      try {
        const parserModule = await import(`./list/${fileName}`);
        const parser: EmailParser = parserModule.default || parserModule.parser;

        if (parser && parser.enabled) {
          if (!parser.id) {
            parser.id = fileName;
          }
          parsers.push(parser);
        }
      } catch (error) {
        console.error(`Failed to load parser ${fileName}:`, error);
      }
    }
  }

  // Load custom DB parsers if userId is provided
  if (userId) {
    try {
      const records = await db
        .select()
        .from(emailParsers)
        .where(
          and(eq(emailParsers.userId, userId), eq(emailParsers.enabled, true)),
        );

      for (const record of records) {
        const rules = record.regexRules as Record<string, string | null>;
        parsers.push({
          id: record.id,
          name: record.name,
          senderEmails: [record.senderEmail],
          enabled: record.enabled,
          parse: (emailBody: string) => {
            const isSuccessRegex = rules.isSuccess
              ? new RegExp(rules.isSuccess, 'i')
              : null;
            if (isSuccessRegex && !isSuccessRegex.test(emailBody)) {
              return [];
            }

            let amount = 0;
            if (rules.amount) {
              const match = emailBody.match(new RegExp(rules.amount, 'i'));
              if (match) amount = parseFloat(match[1].replace(/,/g, ''));
            }

            let type = 'expense';
            if (rules.type) {
              const match = emailBody.match(new RegExp(rules.type, 'i'));
              if (match && match[1].toLowerCase().includes('income')) {
                type = 'income';
              }
            }

            let dateStr = new Date().toISOString();
            if (rules.date) {
              const match = emailBody.match(new RegExp(rules.date, 'i'));
              if (match) {
                const d = new Date(match[1].trim());
                if (!isNaN(d.getTime())) dateStr = d.toISOString();
              }
            }

            let walletSourceId = 'custom';
            if (rules.walletSourceId) {
              const match = emailBody.match(
                new RegExp(rules.walletSourceId, 'i'),
              );
              if (match) walletSourceId = match[1].trim();
            }

            let remark = '';
            if (rules.remark) {
              const match = emailBody.match(new RegExp(rules.remark, 'i'));
              if (match) remark = match[1].trim();
            }

            let category = 'Uncategorized';
            if (rules.category) {
              const match = emailBody.match(new RegExp(rules.category, 'i'));
              if (match) category = match[1].trim();
            }

            return [
              {
                amount,
                type: type as 'income' | 'expense',
                walletLabel: `${record.name} - ${walletSourceId}`,
                walletSourceId,
                category,
                date: dateStr,
                remark,
              },
            ];
          },
        });
      }
    } catch (err) {
      console.error('Failed to load custom DB parsers:', err);
    }
  }

  return parsers;
}

export async function getParserById(
  id: string,
  userId?: string,
): Promise<EmailParser | undefined> {
  const parsers = await getAvailableParsers(userId);
  return parsers.find((p) => p.id === id);
}

export async function getParsersByEmails(
  emails: string[],
  userId?: string,
): Promise<EmailParser[]> {
  const parsers = await getAvailableParsers(userId);
  return parsers.filter((p) =>
    p.senderEmails.some((email) => emails.includes(email)),
  );
}
