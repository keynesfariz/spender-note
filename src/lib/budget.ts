// No imports needed, using native Date

interface BudgetPeriod {
  start: Date;
  end: Date;
  daysRemaining: number;
}

interface BudgetDetails {
  remainingBudget: number;
  remainingDailyBudget: number;
}

interface NetWorthDetails {
  netWorth: number;
  totalDebit: number;
  totalCredit: number;
}

/**
 * Calculates current budget period start, end dates, and days remaining.
 */
export function calculatePeriodDates(
  today: Date,
  resetDay: number,
): BudgetPeriod {
  const start = new Date(today);
  const end = new Date(today);

  if (today.getUTCDate() >= resetDay) {
    start.setUTCDate(resetDay);
    
    end.setUTCDate(1); // prevent month overflow
    end.setUTCMonth(today.getUTCMonth() + 1);
    end.setUTCDate(resetDay);
  } else {
    start.setUTCDate(1); // prevent month overflow
    start.setUTCMonth(today.getUTCMonth() - 1);
    start.setUTCDate(resetDay);

    end.setUTCDate(resetDay);
  }

  const diffTime = end.getTime() - today.getTime();
  const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return { start, end, daysRemaining };
}

/**
 * Calculates remaining monthly budget and remaining daily budget.
 */
export function calculateRemainingBudget(
  monthlyAmount: number,
  totalExpenses: number,
  daysRemaining: number,
): BudgetDetails {
  const remainingBudget = monthlyAmount - totalExpenses;
  const remainingDailyBudget =
    daysRemaining > 0 ? remainingBudget / daysRemaining : remainingBudget;

  return { remainingBudget, remainingDailyBudget };
}

/**
 * Calculates net worth, total debit, and total credit from a list of wallets.
 */
export function calculateNetWorth(
  wallets: { balance: string; type: string }[],
): NetWorthDetails {
  let totalDebit = 0;
  let totalCredit = 0;

  wallets.forEach((wallet) => {
    const balanceVal = parseFloat(wallet.balance);
    if (wallet.type === 'credit') {
      totalCredit += balanceVal; // balance is debt for credit cards
    } else {
      totalDebit += balanceVal;
    }
  });

  const netWorth = totalDebit - totalCredit;

  return { netWorth, totalDebit, totalCredit };
}
