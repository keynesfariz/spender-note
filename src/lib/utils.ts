import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanEmailBody(emailBody: string): string {
  if (!emailBody) return '';
  return emailBody
    .replace(/<[^>]*>?/gm, ' ') // Remove HTML tags
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Collapse whitespace/newlines
    .trim()
    .substring(0, 1000); // Truncate to first 1000 chars
}
