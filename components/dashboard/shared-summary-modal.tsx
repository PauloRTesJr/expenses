"use client";

import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlySharedSummary } from "@/lib/transactions/shared-summary";
import type { TransactionWithCategoryAndShares } from "@/types/shared-transactions";
import { startOfMonth, endOfMonth } from "date-fns";

interface SharedSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionWithCategoryAndShares[];
  currentUserId: string;
  month: Date;
}

export function SharedSummaryModal({
  isOpen,
  onClose,
  transactions,
  currentUserId,
  month,
}: SharedSummaryModalProps) {
  const summary = calculateMonthlySharedSummary(transactions, currentUserId, month);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const sharedTx = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    if (txDate < monthStart || txDate > monthEnd) return false;
    return tx.transaction_shares.some(
      (s) =>
        s.status === "accepted" &&
        (tx.user_id === currentUserId || s.shared_with_user_id === currentUserId),
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Despesas/Receitas Divididas"
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((s) => (
            <div
              key={s.userId}
              className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <p className="text-sm font-medium text-white mb-2">{s.userName}</p>
              <p className="text-xs text-gray-400">
                Total Receitas:{" "}
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(s.totalIncome)}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Total Despesas:{" "}
                <span className="text-red-400 font-semibold">
                  {formatCurrency(s.totalExpense)}
                </span>
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((s) => (
            <div
              key={s.userId}
              className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              {s.balance >= 0 ? (
                <p className="text-sm text-gray-300 mb-1">
                  Receber de {s.userName}
                </p>
              ) : (
                <p className="text-sm text-gray-300 mb-1">
                  Pagar para {s.userName}
                </p>
              )}
              <p
                className={`text-xl font-bold ${
                  s.balance >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(Math.abs(s.balance))}
              </p>
            </div>
          ))}
        </div>
        <div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-2">Nome</th>
                <th className="py-2 text-right">Valor</th>
                <th className="py-2">Compartilhado com</th>
              </tr>
            </thead>
            <tbody>
              {sharedTx.map((tx) => {
                const otherNames = tx.user_id === currentUserId
                  ? tx.transaction_shares
                      .filter((s) => s.status === "accepted")
                      .map(
                        (s) =>
                          s.profiles.full_name ||
                          s.profiles.email.split("@")[0],
                      )
                      .join(", ")
                  : tx.owner.full_name || tx.owner.email.split("@")[0];
                return (
                  <tr key={tx.id} className="border-t border-gray-700">
                    <td className="py-2 text-gray-300">{tx.description}</td>
                    <td
                      className={`py-2 text-right font-semibold ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-2 text-gray-300">{otherNames}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
