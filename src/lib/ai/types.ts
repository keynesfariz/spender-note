export interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  remark?: string;
  accountLabel: string;
}

export interface AIProvider {
  extractTransactions(emailBody: string): Promise<TransactionData[]>;
}
