"use client";

import { useState, useEffect, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import { Modal } from "@/components/ui/modal";
import { UserSelector } from "@/components/forms/user-selector";

import { TransactionFormData, TransactionShareInput } from "@/types/database";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: TransactionFormData & { shares?: TransactionShareInput[] }
  ) => Promise<void>;
  categories: Category[];
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    description: "",
    amount: 0,
    type: "expense",
    category_id: "",
    date: new Date(),
    is_installment: false,
    installment_count: undefined,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [shareConfig, setShareConfig] = useState<TransactionShareInput[]>([]);

  // Always set equal shares when selectedUsers or amount changes
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setShareConfig([]);
      return;
    }
    const equalValue = Number((formData.amount / selectedUsers.length).toFixed(2));
    setShareConfig(selectedUsers.map((userId) => ({
      userId,
      shareType: 'equal',
      shareValue: null,
    })));
  }, [selectedUsers, formData.amount]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('[DEBUG] TransactionForm handleSubmit', { formData, selectedUsers, shareConfig });
      await onSubmit({
        ...formData,
        shares: selectedUsers.length > 0 ? shareConfig : undefined,
      });
      // Reset form
      setFormData({
        description: "",
        amount: 0,
        type: "expense",
        category_id: "",
        date: new Date(),
        is_installment: false,
        installment_count: undefined,
      });
      setSelectedUsers([]);
      setShareConfig([]);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Income/Expense"
      size="lg"
    >
      <div className="card-glass">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
          {/* Transaction Type */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "income",
                    category_id: "",
                  }))
                }
                className={`p-4 rounded-xl transition-all duration-200 ${
                  formData.type === "income"
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500/30 text-green-400 shadow-lg shadow-green-500/10"
                    : "bg-[#242b3d]/60 border-2 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-[#2a334e]/60"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium">Income</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "expense",
                    category_id: "",
                  }))
                }
                className={`p-4 rounded-xl transition-all duration-200 ${
                  formData.type === "expense"
                    ? "bg-gradient-to-br from-red-500/20 to-rose-500/10 border-2 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10"
                    : "bg-[#242b3d]/60 border-2 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-[#2a334e]/60"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 20V4m8 8H4"
                    />
                  </svg>
                  <span className="font-medium">Expense</span>
                </div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description *
            </label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="e.g. Salary, Supermarket"
              size="default"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center justify-center w-12 pointer-events-none text-gray-400 z-10">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <NumericFormat
                id="amount"
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                placeholder="0,00"
                value={formData.amount || ""}
                onValueChange={(values) => {
                  const { floatValue } = values;
                  setFormData((prev) => ({
                    ...prev,
                    amount: floatValue || 0,
                  }));
                }}
                customInput={Input as ComponentType<InputProps>}
                className="pl-12"
                size="default"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Date *
            </label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date: new Date(e.target.value),
                }))
              }
              prefix={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              size="default"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Category
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center justify-center w-12 pointer-events-none text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <select
                id="category"
                value={formData.category_id || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: e.target.value || undefined,
                  }))
                }
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border transition-all duration-200 ease-in-out bg-[rgba(36,43,61,0.85)] backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-800/50 hover:border-gray-500 hover:shadow-sm border-gray-600 focus:border-[--accent-primary] focus:shadow-[0_0_0_2px_rgba(102,126,234,0.2)] pl-12 pr-10 appearance-none"
              >
                <option value="">Select category (optional)</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 20 20"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 8l4 4 4-4"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* Close grid */}
          </div>

          {/* User Selector for Sharing */}
          <UserSelector
            selectedUsers={selectedUsers}
            onUsersChange={setSelectedUsers}
          />



          {/* Installment */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div
                className={`relative w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                  formData.is_installment
                    ? "border-green-500 bg-green-500/20"
                    : "border-gray-600 bg-[#242b3d]/60 group-hover:border-gray-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.is_installment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_installment: e.target.checked,
                      installment_count: e.target.checked ? 2 : undefined,
                    }))
                  }
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                />
                {formData.is_installment && (
                  <svg
                    className="w-4 h-4 text-green-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                Installment transaction
              </span>
            </label>
          </div>

          {/* Number of Installments (only appears if installment) */}
          {formData.is_installment && (
            <div className="mt-3 pl-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of installments
              </label>
              <Input
                type="number"
                min="2"
                max="24"
                value={formData.installment_count || 2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    installment_count: parseInt(e.target.value) || 2,
                  }))
                }
                prefix={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                }
                size="default"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/50 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !formData.description || formData.amount <= 0
              }
              className="btn-primary btn-gradient text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save Transaction</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
