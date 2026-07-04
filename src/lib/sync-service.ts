import { eq } from 'drizzle-orm';
import { transactions, wallets } from '@/db/schema';
import { extractTransactionsFromEmail } from '@/lib/ai';

export type Wallet = typeof wallets.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

/**
 * Searches the user's wallets to find one matching the transaction's account label.
 */
export function findMatchingWallet(userWallets: Wallet[], accountLabel?: string): Wallet | undefined {
  if (!accountLabel) return undefined;
  return userWallets.find((wallet) =>
    wallet.label.toLowerCase().includes(accountLabel.toLowerCase())
  );
}

/**
 * Calculates the new balance of a wallet based on the transaction type and amount.
 */
export function calculateNewBalance(
  currentBalanceStr: string,
  walletType: string,
  txType: string,
  txAmount: number
): number {
  const currentBalance = parseFloat(currentBalanceStr);
  if (walletType === 'credit') {
    // For credit cards, expenses increase the balance (debt)
    return currentBalance + (txType === 'expense' ? txAmount : -txAmount);
  } else {
    // For debit, expenses decrease the balance
    return currentBalance + (txType === 'expense' ? -txAmount : txAmount);
  }
}

/**
 * Orchestrates transaction insertion and wallet balance updates for a matched transaction.
 */
export async function saveTransactionAndUpdateWallet(
  db: any,
  userId: string,
  wallet: Wallet,
  txData: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    remark?: string;
  }
): Promise<void> {
  const txAmountNum = txData.amount;
  const newBalance = calculateNewBalance(wallet.balance, wallet.type, txData.type, txAmountNum);

  // Insert the transaction
  await db.insert(transactions).values({
    userId,
    walletId: wallet.id,
    amount: txAmountNum.toString(),
    type: txData.type,
    category: txData.category,
    date: new Date(txData.date),
    remark: txData.remark || null,
  });

  // Update wallet balance
  await db
    .update(wallets)
    .set({ balance: newBalance.toString() })
    .where(eq(wallets.id, wallet.id));
}

/**
 * Syncs transactions from a list of fetched emails.
 */
export async function syncEmailTransactions(
  db: any,
  userId: string,
  emails: { id: string; body: string }[],
  userWallets: Wallet[]
): Promise<number> {
  let savedCount = 0;

  for (const email of emails) {
    const extractedTransactions = await extractTransactionsFromEmail(email.body);

    for (const txData of extractedTransactions) {
      const wallet = findMatchingWallet(userWallets, txData.accountLabel);

      if (wallet) {
        await saveTransactionAndUpdateWallet(db, userId, wallet, txData);
        savedCount++;
      }
    }
  }

  return savedCount;
}
