import path from 'path';
import fs from 'fs';

import { EmailParser } from './types';

export async function getAvailableParsers(): Promise<EmailParser[]> {
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

  return parsers;
}

export async function getParserById(
  id: string,
): Promise<EmailParser | undefined> {
  const parsers = await getAvailableParsers();
  return parsers.find((p) => p.id === id);
}

export async function getParsersByEmails(
  emails: string[],
): Promise<EmailParser[]> {
  const parsers = await getAvailableParsers();
  return parsers.filter((p) =>
    p.senderEmails.some((email) => emails.includes(email)),
  );
}
