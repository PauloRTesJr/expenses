"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction, Category } from "@/types/database";

interface TransactionWithCategory extends Transaction {
  category?: Category;
}

interface TransactionsListProps {
  transactions: TransactionWithCategory[];
  isLoading?: boolean;
}

export function TransactionsList({
  transactions,
  isLoading,
}: TransactionsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getInstallmentInfo = (transaction: Transaction) => {
    if (
      !transaction.is_installment ||
      !transaction.installment_current ||
      !transaction.installment_count
    ) {
      return null;
    }

    // Calcular valor original total (valor atual * número total de parcelas)
    const originalAmount = transaction.amount * transaction.installment_count;

    return {
      current: transaction.installment_current,
      total: transaction.installment_count,
      originalAmount,
    };
  };

  if (isLoading) {
    return (
      <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-gray-400">
            Adicione suas primeiras receitas e despesas para começar a
            visualizar seus dados financeiros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">
          Transações ({transactions.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#2a2a2a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                Parcelamento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((transaction) => {
              const installmentInfo = getInstallmentInfo(transaction);

              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-[#2a2a2a] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {transaction.description}
                    </div>
                    {installmentInfo && (
                      <div className="text-xs text-gray-400 mt-1">
                        Valor original:{" "}
                        {formatCurrency(installmentInfo.originalAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                      {transaction.category?.name || "Sem categoria"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {format(new Date(transaction.date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`text-sm font-medium ${
                        transaction.type === "income"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {installmentInfo ? (
                      <div className="text-sm">
                        <span className="text-[#1DB954] font-medium">
                          {installmentInfo.current}/{installmentInfo.total}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          Parcelado
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
