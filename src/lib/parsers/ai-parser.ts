import { extractTransactionsFromEmail } from '@/lib/ai';
import { EmailParser, TransactionData } from './types';

export const aiEmailParser: EmailParser = {
  id: 'ai-parser',
  name: 'AI Email Parser',
  senderEmails: [], // Sender routing is handled dynamically in AI mode
  enabled: true,
  parse: async (emailBody: string): Promise<TransactionData[]> => {
    const rawTx = await extractTransactionsFromEmail(emailBody);
    return rawTx.map((tx) => ({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      remark: tx.remark,
      walletLabel: tx.accountLabel,
      walletSourceId: tx.accountLabel,
    }));
  },
};
