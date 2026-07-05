import { getAIProvider } from './ai/provider-factory';

export async function extractTransactionsFromEmail(emailBody: string) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);

  return provider.extractTransactions(emailBody);
}
