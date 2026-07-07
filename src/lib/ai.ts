import { getAIProvider } from './ai/provider-factory';

export async function extractTransactionsFromEmail(emailBody: string) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);

  return provider.extractTransactions(emailBody);
}

export async function generateParserRules(emailBody: string) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);

  return provider.generateParserRules(emailBody);
}

export async function fixParserRule(
  emailBody: string,
  field: string,
  expectedValue: string,
) {
  const providerName = process.env.AI_PROVIDER || 'gemini';
  const provider = getAIProvider(providerName);

  return provider.fixParserRule(emailBody, field, expectedValue);
}
