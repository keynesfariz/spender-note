import { Temporal } from '@js-temporal/polyfill';

interface BudgetPeriod {
  start: Temporal.PlainDate;
  end: Temporal.PlainDate;
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
  today: Temporal.PlainDate,
  resetDay: number,
): BudgetPeriod {
  let start: Temporal.PlainDate;
  let end: Temporal.PlainDate;

  if (today.day >= resetDay) {
    start = today.with({ day: resetDay });
    end = today.add({ months: 1 }).with({ day: resetDay });
  } else {
    start = today.subtract({ months: 1 }).with({ day: resetDay });
    end = today.with({ day: resetDay });
  }

  const daysRemaining = end.since(today).days;

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
