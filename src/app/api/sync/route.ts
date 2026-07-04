import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { budgetSettings, transactions, wallets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchRecentEmails } from '@/lib/gmail';
import { extractTransactionsFromEmail } from '@/lib/ai';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;
  const userId = user.id;

  if (!providerToken) {
    return NextResponse.json({ error: 'Google provider token not found. Please log in again.' }, { status: 401 });
  }

  // Get budget settings for sender filter
  const settings = await db.select().from(budgetSettings).where(eq(budgetSettings.userId, userId)).limit(1);
  const senderFilter = settings[0]?.senderEmailFilter;

  if (!senderFilter) {
    return NextResponse.json({ error: 'Sender email filter not configured in budget settings.' }, { status: 400 });
  }

  // Fetch emails
  const emails = await fetchRecentEmails(providerToken, senderFilter);
  
  if (emails.length === 0) {
    return NextResponse.json({ message: 'No new emails found matching the filter.' });
  }

  // Fetch user wallets to map accounts
  const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
  let savedCount = 0;

  for (const email of emails) {
    const extractedData = await extractTransactionsFromEmail(email.body);
    
    for (const txData of extractedData) {
      // Find matching wallet (simplistic matching for now)
      const wallet = userWallets.find(w => w.label.toLowerCase().includes(txData.accountLabel?.toLowerCase() || ''));
      
      if (wallet) {
        await db.insert(transactions).values({
          userId,
          walletId: wallet.id,
          amount: txData.amount.toString(),
          type: txData.type,
          category: txData.category,
          date: new Date(txData.date),
          remark: txData.remark,
        });

        // Update wallet balance if expense or income
        const amount = parseFloat(txData.amount);
        let currentBalance = parseFloat(wallet.balance);
        
        if (wallet.type === 'credit') {
          // For credit cards, expenses increase the balance (debt)
          currentBalance += (txData.type === 'expense' ? amount : -amount);
        } else {
          // For debit, expenses decrease the balance
          currentBalance += (txData.type === 'expense' ? -amount : amount);
        }

        await db.update(wallets)
          .set({ balance: currentBalance.toString() })
          .where(eq(wallets.id, wallet.id));

        savedCount++;
      }
    }
  }

  return NextResponse.json({ message: `Synced ${savedCount} transactions successfully.` });
}
