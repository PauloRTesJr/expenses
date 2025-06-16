"use client";

import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { TransactionWithShares } from "@/types/shared-transactions";
import { calculateMonthlySplits } from "@/lib/shared-calculations";

interface SplitSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionWithShares[];
  month: Date;
  currentUserId: string;
}

export function SplitSummaryModal({
  isOpen,
  onClose,
  transactions,
  month,
  currentUserId,
}: SplitSummaryModalProps) {
  const { userTotals, settlements } = calculateMonthlySplits(transactions, month);

  const getName = (uid: string) => (uid === currentUserId ? "You" : `User ${uid.slice(0, 4)}`);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shared Summary" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(userTotals).map(([uid, totals]) => (
            <div
              key={uid}
              className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <p className="text-sm text-gray-300 font-medium mb-2">
                {getName(uid)}
              </p>
              <p className="text-xs text-gray-400">
                Income: <span className="text-white">{formatCurrency(totals.income)}</span>
              </p>
              <p className="text-xs text-gray-400">
                Expenses: <span className="text-white">{formatCurrency(totals.expense)}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {settlements.length === 0 && (
            <p className="text-sm text-gray-400">No settlements needed.</p>
          )}
          {settlements.map((s) => (
            <p key={`${s.from}-${s.to}`} className="text-sm text-gray-300">
              {getName(s.from)} must pay {formatCurrency(s.amount)} to {getName(s.to)}
            </p>
          ))}
        </div>
      </div>
    </Modal>
  );
}
