"use client";

import { useState } from "react";
import { TransactionShareInput } from "@/types/database";

interface ShareConfigProps {
  selectedUsers: string[];
  totalAmount: number;
  onShareConfigChange: (shares: TransactionShareInput[]) => void;
}

export function ShareConfig({
  selectedUsers,
  totalAmount,
  onShareConfigChange,
}: ShareConfigProps) {
  const [shareType, setShareType] = useState<
    "equal" | "percentage" | "fixed_amount"
  >("equal");
  const [shares, setShares] = useState<Record<string, number>>({});

  const handleShareTypeChange = (
    type: "equal" | "percentage" | "fixed_amount"
  ) => {
    setShareType(type);
    setShares({});
    updateShares(type, {});
  };

  const handleShareValueChange = (userId: string, value: number) => {
    const newShares = { ...shares, [userId]: value };
    setShares(newShares);
    updateShares(shareType, newShares);
  };

  const updateShares = (
    type: "equal" | "percentage" | "fixed_amount",
    currentShares: Record<string, number>
  ) => {
    const shareInputs: TransactionShareInput[] = selectedUsers.map(
      (userId) => ({
        userId,
        shareType: type,
        shareValue: type === "equal" ? undefined : currentShares[userId] || 0,
      })
    );

    onShareConfigChange(shareInputs);
  };

  const calculateRemainingAmount = () => {
    if (shareType === "fixed_amount") {
      const usedAmount = Object.values(shares).reduce(
        (sum, value) => sum + (value || 0),
        0
      );
      return totalAmount - usedAmount;
    }
    return 0;
  };

  const calculateRemainingPercentage = () => {
    if (shareType === "percentage") {
      const usedPercentage = Object.values(shares).reduce(
        (sum, value) => sum + (value || 0),
        0
      );
      return 100 - usedPercentage;
    }
    return 0;
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-lg border border-gray-700">
      <h3 className="text-sm font-medium text-gray-300">Share Configuration</h3>

      {/* Share Type Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-400">
          How to split?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleShareTypeChange("equal")}
            className={`p-2 rounded-lg text-xs transition-all ${
              shareType === "equal"
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                : "bg-gray-700/50 border border-gray-600 text-gray-400 hover:bg-gray-600/50"
            }`}
          >
            Equal Split
          </button>
          <button
            type="button"
            onClick={() => handleShareTypeChange("percentage")}
            className={`p-2 rounded-lg text-xs transition-all ${
              shareType === "percentage"
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                : "bg-gray-700/50 border border-gray-600 text-gray-400 hover:bg-gray-600/50"
            }`}
          >
            Percentage
          </button>
          <button
            type="button"
            onClick={() => handleShareTypeChange("fixed_amount")}
            className={`p-2 rounded-lg text-xs transition-all ${
              shareType === "fixed_amount"
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                : "bg-gray-700/50 border border-gray-600 text-gray-400 hover:bg-gray-600/50"
            }`}
          >
            Fixed Amount
          </button>
        </div>
      </div>

      {/* Share Configuration */}
      {shareType === "equal" && (
        <div className="text-sm text-gray-400">
          Each user will pay:{" "}
          <span className="text-white font-medium">
            ${(totalAmount / (selectedUsers.length + 1)).toFixed(2)}
          </span>
        </div>
      )}

      {(shareType === "percentage" || shareType === "fixed_amount") && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400">
            Configure individual shares:
          </div>

          {selectedUsers.map((userId) => (
            <div key={userId} className="flex items-center gap-3">
              <span className="text-sm text-gray-300 flex-1 truncate">
                User {userId.slice(0, 8)}...
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={
                    shareType === "percentage" ? "100" : totalAmount.toString()
                  }
                  step={shareType === "percentage" ? "1" : "0.01"}
                  value={shares[userId] || ""}
                  onChange={(e) =>
                    handleShareValueChange(
                      userId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  className="w-20 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-xs text-gray-400">
                  {shareType === "percentage" ? "%" : "$"}
                </span>
              </div>
            </div>
          ))}

          {/* Remaining Amount/Percentage Indicator */}
          {shareType === "fixed_amount" && (
            <div className="text-xs text-gray-400">
              Remaining amount:{" "}
              <span
                className={`font-medium ${
                  calculateRemainingAmount() < 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                ${calculateRemainingAmount().toFixed(2)}
              </span>
            </div>
          )}

          {shareType === "percentage" && (
            <div className="text-xs text-gray-400">
              Remaining percentage:{" "}
              <span
                className={`font-medium ${
                  calculateRemainingPercentage() < 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {calculateRemainingPercentage().toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Warning Messages */}
      {shareType === "fixed_amount" && calculateRemainingAmount() < 0 && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          ⚠️ Total shares exceed transaction amount
        </div>
      )}

      {shareType === "percentage" && calculateRemainingPercentage() < 0 && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          ⚠️ Total percentage exceeds 100%
        </div>
      )}
    </div>
  );
}
