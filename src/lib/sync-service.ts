import { eq } from 'drizzle-orm';

import { getParsersByEmails } from '@/lib/parsers/registry';
import { extractTransactionsFromEmail } from '@/lib/ai';
import { transactions, wallets } from '@/db/schema';

export type Wallet = typeof wallets.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

/**
 * Searches the user's wallets to find one matching the transaction's account label.
 */
export async function findOrCreateWallet(
  db: any,
  userId: string,
  userWallets: Wallet[],
  accountLabel?: string,
  walletSourceId?: string,
  walletType: 'debit' | 'credit' = 'debit',
): Promise<Wallet | undefined> {
  if (!accountLabel) return undefined;

  let wallet: Wallet | undefined;

  if (walletSourceId) {
    wallet = userWallets.find((w) => w.sourceId === walletSourceId);
  }

  if (!wallet) {
    wallet = userWallets.find((w) =>
      w.label.toLowerCase().includes(accountLabel.toLowerCase()),
    );
  }

  if (!wallet) {
    const [newWallet] = await db
      .insert(wallets)
      .values({
        userId,
        sourceId: walletSourceId || null,
        label: accountLabel,
        type: walletType,
        balance: '0',
      })
      .returning();

    userWallets.push(newWallet);
    wallet = newWallet;
  }

  return wallet;
}

/**
 * Calculates the new balance of a wallet based on the transaction type and amount.
 */
export function calculateNewBalance(
  currentBalanceStr: string,
  walletType: string,
  txType: string,
  txAmount: number,
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
  },
  emailId?: string,
): Promise<boolean> {
  const txAmountNum = txData.amount;
  const newBalance = calculateNewBalance(
    wallet.balance,
    wallet.type,
    txData.type,
    txAmountNum,
  );

  // Insert the transaction
  const insertedTx = await db
    .insert(transactions)
    .values({
      userId,
      emailId,
      walletId: wallet.id,
      amount: txAmountNum.toString(),
      type: txData.type,
      category: txData.category,
      date: new Date(txData.date),
      remark: txData.remark || null,
    })
    .onConflictDoNothing({ target: transactions.emailId })
    .returning();

  if (insertedTx.length === 0) {
    // Was not inserted due to idempotency conflict
    return false;
  }

  // Update wallet balance
  await db
    .update(wallets)
    .set({ balance: newBalance.toString() })
    .where(eq(wallets.id, wallet.id));

  return true;
}

/**
 * Syncs transactions from a list of fetched emails.
 */
export async function syncEmailTransactions(
  db: any,
  userId: string,
  emails: { id: string; body: string; from: string }[],
  userWallets: Wallet[],
): Promise<number> {
  let savedCount = 0;

  for (const email of emails) {
    // Find parser for this email
    // email.from can be formatted like "Bank <alerts@bank.com>", extract exact email
    const match = email.from?.match(/<([^>]+)>/);
    const fromAddress = match
      ? match[1].toLowerCase()
      : email.from?.toLowerCase();

    const parsers = await getParsersByEmails([fromAddress]);
    if (parsers.length === 0) continue;

    const parser = parsers[0]; // use the first matching parser
    const extractedTransactions = await parser.parse(email.body);

    for (const txData of extractedTransactions) {
      const wallet = await findOrCreateWallet(
        db,
        userId,
        userWallets,
        txData.walletLabel,
        txData.walletSourceId,
        txData.walletType || 'debit',
      );

      if (wallet) {
        const saved = await saveTransactionAndUpdateWallet(
          db,
          userId,
          wallet,
          txData,
          email.id,
        );
        if (saved) savedCount++;
      }
    }
  }

  return savedCount;
}
