import { and, eq } from 'drizzle-orm';

import { emailParsers } from '@/db/schema';
import { EmailParser } from './types';
import { db } from '@/db';

export async function getAvailableParsers(
  userId?: string,
): Promise<EmailParser[]> {
  if (!userId) {
    return [];
  }

  try {
    const records = await db
      .select()
      .from(emailParsers)
      .where(
        and(eq(emailParsers.userId, userId), eq(emailParsers.enabled, true)),
      );

    return records.map(createParserFromRecord);
  } catch (err) {
    console.error('Failed to load custom DB parsers:', err);
    return [];
  }
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

// --- Helper Functions ---

type EmailParserRecord = typeof emailParsers.$inferSelect;
type RegexRules = Record<string, string | null>;

function createParserFromRecord(record: EmailParserRecord): EmailParser {
  const rules = record.regexRules as RegexRules;

  return {
    id: record.id,
    name: record.name,
    senderEmails: [record.senderEmail],
    enabled: record.enabled,
    parse: (emailBody: string) => {
      if (!isParseable(emailBody, rules.isSuccess)) {
        return [];
      }

      const walletSourceId = extractWalletSourceId(
        emailBody,
        rules.walletSourceId,
      );

      return [
        {
          amount: extractAmount(emailBody, rules.amount),
          type: extractType(emailBody, rules.type),
          walletLabel: `${record.name} - ${walletSourceId}`,
          walletSourceId,
          category: extractCategory(emailBody, rules.category),
          date: extractDate(emailBody, rules.date),
          remark: extractRemark(emailBody, rules.remark),
        },
      ];
    },
  };
}

function extractMatch(body: string, regexStr: string | null): string | null {
  if (!regexStr) return null;
  const match = body.match(new RegExp(regexStr, 'i'));
  if (!match) return null;

  const value = match[1] ?? match[0];
  return value ? value.trim() : null;
}

function isParseable(body: string, regexStr: string | null): boolean {
  if (!regexStr) return true;
  return new RegExp(regexStr, 'i').test(body);
}

function extractAmount(body: string, regexStr: string | null): number {
  const match = extractMatch(body, regexStr);
  if (!match) return 0;
  return parseFloat(match.replace(/,/g, '')) || 0;
}

function extractType(
  body: string,
  regexStr: string | null,
): 'income' | 'expense' {
  const match = extractMatch(body, regexStr);
  if (match && match.toLowerCase().includes('income')) {
    return 'income';
  }
  return 'expense';
}

function extractDate(body: string, regexStr: string | null): string {
  const match = extractMatch(body, regexStr);
  if (match) {
    const d = new Date(match);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return new Date().toISOString();
}

function extractWalletSourceId(body: string, regexStr: string | null): string {
  return extractMatch(body, regexStr) || 'custom';
}

function extractCategory(body: string, regexStr: string | null): string {
  return extractMatch(body, regexStr) || 'Uncategorized';
}

function extractRemark(body: string, regexStr: string | null): string {
  return extractMatch(body, regexStr) || '';
}
