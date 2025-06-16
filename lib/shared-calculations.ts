import { startOfMonth, endOfMonth } from "date-fns";
import { TransactionWithShares } from "@/types/shared-transactions";

export interface MonthlySplitResults {
  userTotals: Record<string, { income: number; expense: number }>;
  settlements: { from: string; to: string; amount: number }[];
}

export function calculateMonthlySplits(
  transactions: TransactionWithShares[],
  month: Date
): MonthlySplitResults {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const totals: Record<string, { income: number; expense: number }> = {};
  const balances: Record<string, Record<string, number>> = {};

  const getTotals = (uid: string) => {
    if (!totals[uid]) {
      totals[uid] = { income: 0, expense: 0 };
    }
    return totals[uid];
  };

  const incBalance = (from: string, to: string, amount: number) => {
    if (!balances[from]) {
      balances[from] = {};
    }
    balances[from][to] = (balances[from][to] || 0) + amount;
  };

  for (const tx of transactions) {
    const date = new Date(tx.date);
    if (date < start || date > end) continue;

    const shares = tx.transaction_shares || [];
    const shareAmounts: { userId: string; amount: number }[] = [];
    for (const share of shares) {
      let amount = 0;
      if (share.share_type === "equal") {
        amount = tx.amount / (shares.length + 1);
      } else if (share.share_type === "percentage") {
        amount = ((share.share_value || 0) / 100) * tx.amount;
      } else {
        amount = share.share_value || 0;
      }
      shareAmounts.push({ userId: share.shared_with_user_id, amount });
    }
    const sharedTotal = shareAmounts.reduce((s, a) => s + a.amount, 0);
    const ownerAmount = tx.amount - sharedTotal;
    shareAmounts.push({ userId: tx.user_id, amount: ownerAmount });

    for (const part of shareAmounts) {
      const t = getTotals(part.userId);
      if (tx.type === "income") t.income += part.amount;
      else t.expense += part.amount;
    }

    for (const part of shareAmounts) {
      if (part.userId === tx.user_id) continue;
      if (tx.type === "expense") {
        incBalance(part.userId, tx.user_id, part.amount);
      } else {
        incBalance(tx.user_id, part.userId, part.amount);
      }
    }
  }

  const settlements: { from: string; to: string; amount: number }[] = [];
  for (const from in balances) {
    for (const to in balances[from]) {
      const amount =
        balances[from][to] - (balances[to]?.[from] ? balances[to][from] : 0);
      if (amount > 0) {
        settlements.push({ from, to, amount });
      }
    }
  }

  return { userTotals: totals, settlements };
}
