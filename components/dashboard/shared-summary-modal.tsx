"use client";

import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlySharedSummary } from "@/lib/transactions/shared-summary";
import type { TransactionWithShares } from "@/types/shared-transactions";

interface SharedSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionWithShares[];
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
      </div>
    </Modal>
  );
}
