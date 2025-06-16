"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { TransactionWithCategoryAndShares } from "@/types/shared-transactions";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  Hash,
} from "lucide-react";

interface TransactionHistoryProps {
  transactions: TransactionWithCategoryAndShares[];
  isLoading: boolean;
  currentUserId: string;
}

export function TransactionHistory({
  transactions,
  isLoading,
  currentUserId,
}: TransactionHistoryProps) {
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "sharedBy">("date");

  const displayedTransactions = useMemo(() => {
    const sharedFiltered = showSharedOnly
      ? transactions.filter(
          (t) => t.transaction_shares && t.transaction_shares.length > 0
        )
      : transactions;
    const sorted = [...sharedFiltered].sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const aName =
        a.transaction_shares?.[0]?.profiles?.full_name?.toLowerCase() || "";
      const bName =
        b.transaction_shares?.[0]?.profiles?.full_name?.toLowerCase() || "";
      return aName.localeCompare(bName);
    });

    return sorted;
  }, [transactions, showSharedOnly, sortBy]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-emerald-500";
      case "expense":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusLabel = (type: string) => {
    return type === "income" ? "Receita" : "Despesa";
  };
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
    // Para o histórico de transações, mostra o valor da parcela individual
    // que é o valor relevante para cada mês
    return transaction.amount;
  };

  const formatOwner = (transaction: TransactionWithCategoryAndShares) => {
    // Check if this transaction belongs to the current user
    if (transaction.user_id === currentUserId) {
      return "Você";
    }

    // If not the current user's transaction, show the owner's name from owner_profile
    if (transaction.owner_profile) {
      return (
        transaction.owner_profile.full_name?.split(" ")[0] ||
        transaction.owner_profile.email?.split("@")[0] ||
        "Usuário"
      );
    }

    // Fallback
    return "Usuário";
  };
  const formatSharedUsers = (transaction: TransactionWithCategoryAndShares) => {
    if (
      !transaction.transaction_shares ||
      transaction.transaction_shares.length === 0
    ) {
      return null;
    }

    // Show all shares (status is always accepted now)
    const allShares = transaction.transaction_shares;

    if (allShares.length === 0) {
      return null;
    }

    const userNames = allShares.map((share) => {
      // If this share belongs to the current user, show "Você"
      if (share.shared_with_user_id === currentUserId) {
        return "Você";
      }

      // Otherwise, show the user's name
      return (
        share.profiles?.full_name?.split(" ")[0] ||
        share.profiles?.email?.split("@")[0] ||
        "Usuário"
      );
    });

    if (userNames.length === 1) {
      return userNames[0];
    } else if (userNames.length === 2) {
      return `${userNames[0]}, ${userNames[1]}`;
    } else {
      return `${userNames[0]} +${userNames.length - 1}`;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            Histórico de Transações
          </h3>
          <p className="text-gray-400 text-sm">
            Últimas movimentações financeiras
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowSharedOnly((prev) => !prev)}
            className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle shared filter"
          >
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() =>
              setSortBy((prev) => (prev === "date" ? "sharedBy" : "date"))
            }
            className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle sort mode"
          >
            {" "}
            {sortBy === "date" ? (
              <Hash className="w-4 h-4 text-gray-400" />
            ) : (
              <Users className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>{" "}
      {/* Table Header */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4 text-sm font-medium text-gray-400 mb-4 px-4">
        <div className="min-w-0">Nome</div>
        <div className="min-w-0">Parcelas</div>
        <div className="min-w-0">Proprietário</div>
        <div className="min-w-0">Compartilhamento</div>
        <div className="min-w-0 text-right">Valor</div>
        <div className="min-w-0 text-center">Status</div>
      </div>
      {/* Transactions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
        <AnimatePresence>
          {displayedTransactions.slice(0, 10).map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.002, transition: { duration: 0.2 } }}
              className="group bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === "income"
                          ? "bg-emerald-500/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>{" "}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                        {transaction.description}
                      </p>{" "}
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="text-orange-400 flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {formatInstallment(transaction)}
                        </span>
                        <span>•</span>
                        <span className="text-purple-400 flex items-center">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {formatOwner(transaction)}
                        </span>
                        {formatSharedUsers(transaction) && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {formatSharedUsers(transaction)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    {" "}
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(
                        Math.abs(getTransactionDisplayAmount(transaction))
                      )}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(
                          transaction.type
                        )}`}
                      ></div>
                      <span className="text-xs text-gray-300">
                        {getStatusLabel(transaction.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>{" "}
              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-6 gap-4 items-center">
                {/* Icon and Description */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.type === "income"
                        ? "bg-emerald-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                      {transaction.description}
                    </p>
                  </div>
                </div>{" "}
                {/* Parcelas */}
                <div className="flex items-center text-gray-400 min-w-0">
                  <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">
                    {formatInstallment(transaction)}
                  </span>
                </div>
                {/* Proprietário */}
                <div className="min-w-0">
                  <div className="flex items-center text-purple-400">
                    <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {formatOwner(transaction)}
                    </span>
                  </div>
                </div>
                {/* Compartilhamento */}
                <div className="min-w-0">
                  {formatSharedUsers(transaction) ? (
                    <div className="flex items-center text-blue-400">
                      <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {formatSharedUsers(transaction)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
                {/* Valor */}
                <div className="text-right min-w-0">
                  <p
                    className={`font-bold text-lg truncate ${
                      transaction.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(
                      Math.abs(getTransactionDisplayAmount(transaction))
                    )}
                  </p>
                </div>
                {/* Status */}
                <div className="flex items-center justify-center min-w-0">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${getStatusColor(
                        transaction.type
                      )}`}
                    ></div>
                    <span className="text-sm text-gray-300 truncate">
                      {getStatusLabel(transaction.type)}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all ml-2 flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Footer */}
      {displayedTransactions.length > 10 && (
        <div className="flex justify-center mt-6">
          <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-white transition-colors">
            Ver todas as transações
          </button>
        </div>
      )}
      {displayedTransactions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            Nenhuma transação encontrada
          </p>
          <p className="text-gray-500 text-sm">
            Adicione sua primeira transação para começar
          </p>
        </div>
      )}
    </motion.div>
  );
}
