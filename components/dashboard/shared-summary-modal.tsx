"use client";

import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlySharedSummary } from "@/lib/transactions/shared-summary";
import type { TransactionWithCategoryAndShares } from "@/types/shared-transactions";
import { Hash } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

interface SharedSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionWithCategoryAndShares[];
  currentUserId: string;
  month: Date;
}

const formatInstallment = (transaction: TransactionWithCategoryAndShares) => {
  if (!transaction.is_installment) {
    return "-";
  }
  return `${transaction.installment_current || 1}/${
    transaction.installment_count || 1
  }`;
};

// Função para obter o valor da parcela individual (não o total)
const getTransactionDisplayAmount = (
  transaction: TransactionWithCategoryAndShares
) => {
  // Para o modal de resumo mensal, sempre mostra o valor da parcela individual
  // que é o valor relevante para os cálculos do mês
  return transaction.amount;
};

export function SharedSummaryModal({
  isOpen,
  onClose,
  transactions,
  currentUserId,
  month,
}: SharedSummaryModalProps) {
  const { t } = useLocale();
  const summary = calculateMonthlySharedSummary(
    transactions,
    currentUserId,
    month
  );
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const monthTransactions = transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      const isInDateRange = txDate >= monthStart && txDate <= monthEnd;
      // Include transactions that are either:
      // 1. Owned by current user and have shares, OR
      // 2. Shared with current user (regardless of who owns them)
      const isRelevantToUser =
        (tx.user_id === currentUserId && tx.transaction_shares.length > 0) ||
        tx.transaction_shares.some(
          (s) =>
            s.status === "accepted" && s.shared_with_user_id === currentUserId
        );

      return isInDateRange && isRelevantToUser;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("sharedModal.title")}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((s) => (
            <div
              key={s.userId}
              className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <p className="text-sm font-medium text-white mb-2">
                {s.userName}
              </p>
              <p className="text-xs text-gray-400">
                {t("sharedModal.totalIncome")}:{" "}
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(s.totalIncome)}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                {t("sharedModal.totalExpense")}:{" "}
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
                  {t("sharedModal.receiveFrom")} {s.userName}
                </p>
              ) : (
                <p className="text-sm text-gray-300 mb-1">
                  {t("sharedModal.payTo")} {s.userName}
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
        </div>{" "}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t("sharedModal.description")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t("sharedModal.owner")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t("sharedModal.installments")}
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t("sharedModal.amount")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t("sharedModal.sharedWith")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {monthTransactions.map((tx) => {
                  // Format owner display
                  const ownerDisplay =
                    tx.user_id === currentUserId
                      ? t("common.you")
                      : tx.owner_profile?.full_name?.split(" ")[0] ||
                        tx.owner_profile?.email?.split("@")[0] ||
                        t("dashboard.userFallback");
                  const participantNames = tx.transaction_shares
                    .filter((s) => s.status === "accepted")
                    .map((s) => {
                      // If this share belongs to the current user, show "You"
                      if (s.shared_with_user_id === currentUserId) {
                        return t("common.you");
                      }

                      // Otherwise, show the user's name
                      return (
                        s.profiles.full_name?.split(" ")[0] ||
                        s.profiles.email.split("@")[0] ||
                        t("dashboard.userFallback")
                      );
                    });
                  return (
                    <tr key={tx.id} className="hover:bg-[#2a2a2a]">
                      <td className="px-4 py-2 text-sm text-white">
                        {tx.description}
                      </td>
                      <td className="px-4 py-2 text-sm text-purple-400">
                        {ownerDisplay}
                      </td>
                      <td className="px-4 py-2 text-sm text-orange-400">
                        <div className="flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {formatInstallment(tx)}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`text-sm font-medium ${
                            tx.type === "income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(
                            Math.abs(getTransactionDisplayAmount(tx))
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {participantNames.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
