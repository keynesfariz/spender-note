export interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  walletLabel: string;
  walletSourceId: string;
  walletType?: 'debit' | 'credit'; // defaults to debit if not specified
  category: string;
  date: string; // ISO string
  remark?: string;
}

export interface EmailParser {
  id?: string; // Optional, will be auto-injected from filename if missing
  name: string; // Display name for the settings page
  senderEmails: string[]; // List of sender emails this parser handles
  status: 'active' | 'broken'; // Used by the system to dynamically filter out broken parsers
  parse: (emailBody: string) => Promise<TransactionData[]> | TransactionData[];
}
