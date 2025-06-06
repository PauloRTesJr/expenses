"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { TransactionFormData } from "@/types/database";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  categories: Array<{ id: string; name: string; type: "income" | "expense" }>;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
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
      title="Nova Receita/Despesa"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Transação */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Tipo de Transação
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
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.type === "income"
                  ? "border-[#1DB954] bg-[#1DB954]/10 text-[#1DB954]"
                  : "border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600"
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
                <span className="font-medium">Receita</span>
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
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.type === "expense"
                  ? "border-red-500 bg-red-500/10 text-red-500"
                  : "border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600"
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
                    d="M20 12H4"
                  />
                </svg>
                <span className="font-medium">Despesa</span>
              </div>
            </button>
          </div>
        </div>

        {/* Nome/Descrição */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Nome da Transação *
          </label>
          <Input
            id="description"
            type="text"
            placeholder="Ex: Salário, Supermercado, Combustível..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            required
          />
        </div>

        {/* Valor */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Valor *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              R$
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="pl-12"
              value={formData.amount || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              required
            />
          </div>
        </div>

        {/* Data */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Data *
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
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Categoria
          </label>
          <select
            id="category"
            value={formData.category_id || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category_id: e.target.value || undefined,
              }))
            }
            className="flex h-12 w-full rounded-lg border border-gray-700 bg-[#2a2a2a] px-4 py-3 text-white transition-all duration-200 focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:ring-offset-2 focus:ring-offset-[#121212]"
          >
            <option value="">Selecionar categoria (opcional)</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parcelamento */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
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
              className="w-5 h-5 text-[#1DB954] bg-[#2a2a2a] border-gray-700 rounded focus:ring-[#1DB954] focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-300">
              Transação parcelada
            </span>
          </label>
        </div>

        {/* Número de Parcelas (aparece apenas se parcelado) */}
        {formData.is_installment && (
          <div>
            <label
              htmlFor="installments"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Número de Parcelas *
            </label>
            <Input
              id="installments"
              type="number"
              min="2"
              max="120"
              placeholder="Ex: 12"
              value={formData.installment_count || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  installment_count: parseInt(e.target.value) || undefined,
                }))
              }
              required={formData.is_installment}
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.installment_count &&
                formData.amount > 0 &&
                `Valor por parcela: R$ ${(
                  formData.amount / formData.installment_count
                ).toFixed(2)}`}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading || !formData.description || formData.amount <= 0
            }
          >
            {isLoading ? "Salvando..." : "Salvar Transação"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
