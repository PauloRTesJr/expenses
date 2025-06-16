export interface SharedSummary {
  userId: string;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

import { TransactionWithShares, TransactionShare } from "@/types/shared-transactions";

function computeShareAmount(
  transaction: TransactionWithShares,
  share: TransactionShare & { profiles: { full_name?: string | null; email?: string | null } },
): number {
  switch (share.share_type) {
    case "percentage":
      return (share.share_value || 0) * transaction.amount;
    case "fixed_amount":
      return share.share_value || 0;
    default:
      // equal split between owner and shared users
      return transaction.amount / (transaction.transaction_shares.length + 1);
  }
}

export function calculateMonthlySharedSummary(
  transactions: TransactionWithShares[],
  currentUserId: string,
  month: Date,
): SharedSummary[] {
  const summaries: Record<string, SharedSummary> = {};

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    if (txDate < monthStart || txDate > monthEnd) return;

    tx.transaction_shares
      .filter((s) => s.status === "accepted")
      .forEach((share) => {
        const otherId = tx.user_id === currentUserId ? share.shared_with_user_id : tx.user_id;
        if (otherId !== currentUserId && share.shared_with_user_id !== currentUserId && tx.user_id !== currentUserId) {
          // not related to current user
          return;
        }
        const userName =
          share.profiles?.full_name || share.profiles?.email?.split("@")[0] || "User";
        if (!summaries[otherId]) {
          summaries[otherId] = {
            userId: otherId,
            userName,
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
          };
        }
        const shareAmount = computeShareAmount(tx, share);
        const summary = summaries[otherId];
        const isOwner = tx.user_id === currentUserId;
        const isCurrentShare = share.shared_with_user_id === currentUserId;

        if (isOwner && share.shared_with_user_id !== currentUserId) {
          // user is owner sharing with other
          if (tx.type === "income") {
            summary.totalIncome += shareAmount;
            summary.balance -= shareAmount;
          } else {
            summary.totalExpense += shareAmount;
            summary.balance += shareAmount;
          }
        } else if (isCurrentShare) {
          // other user is owner sharing with current user
          if (tx.type === "income") {
            summary.totalIncome += shareAmount;
            summary.balance += shareAmount;
          } else {
            summary.totalExpense += shareAmount;
            summary.balance -= shareAmount;
          }
        }
      });
  });

  return Object.values(summaries);
}
