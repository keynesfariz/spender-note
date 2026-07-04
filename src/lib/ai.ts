import { getAIProvider } from './ai/provider-factory';

export async function extractTransactionsFromEmail(emailBody: string) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);
  
  // Clean and compress the email body
  const cleanedBody = emailBody
    .replace(/<[^>]*>?/gm, ' ') // Remove HTML tags
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Collapse whitespace/newlines
    .trim()
    .substring(0, 1000); // Truncate to first 1000 chars

  return provider.extractTransactions(cleanedBody);
}
