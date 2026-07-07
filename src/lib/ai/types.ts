export interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  remark?: string;
  accountLabel: string;
}

export interface GeneratedRegexRules {
  isSuccess: string | null;
  amount: string | null;
  type: string | null;
  date: string | null;
  walletSourceId: string | null;
  remark: string | null;
  category: string | null;
}

export interface AIProvider {
  extractTransactions(emailBody: string): Promise<TransactionData[]>;
  generateParserRules(emailBody: string): Promise<GeneratedRegexRules>;
  fixParserRule(
    emailBody: string,
    field: string,
    expectedValue: string,
  ): Promise<string>;
}
