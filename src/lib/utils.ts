import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanEmailBody(emailBody: string): string {
  if (!emailBody) return '';
  return emailBody
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
