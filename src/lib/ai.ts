import { cleanEmailBody } from './utils';
import { getAIProvider } from './ai/provider-factory';

export async function extractTransactionsFromEmail(emailBody: string) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);
  
  // Clean and compress the email body
  const cleanedBody = cleanEmailBody(emailBody);

  return provider.extractTransactions(cleanedBody);
}
