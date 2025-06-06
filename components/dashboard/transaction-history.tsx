"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@/types/database";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionHistory({
  transactions,
  isLoading,
}: TransactionHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
          <button className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 text-sm font-medium text-gray-400 mb-4 px-4">
        <div>ID</div>
        <div>Nome</div>
        <div>Data</div>
        <div>Valor</div>
        <div>Status</div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {transactions.slice(0, 10).map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="group bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 transition-all duration-200 cursor-pointer"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* ID e Avatar */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "income"
                        ? "bg-emerald-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <TrendingUp
                        className={`w-5 h-5 ${
                          transaction.type === "income"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="md:hidden">
                    <span className="text-xs font-mono text-gray-400">
                      #{transaction.id.slice(-8)}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-sm font-mono text-gray-400">
                      #{transaction.id.slice(-8)}
                    </span>
                  </div>
                </div>

                {/* Nome/Descrição */}
                <div>
                  <p className="font-medium text-white group-hover:text-blue-300 transition-colors">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-400 md:hidden">
                    {formatDate(transaction.date)}
                  </p>
                </div>

                {/* Data */}
                <div className="hidden md:flex items-center text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatDate(transaction.date)}
                  </span>
                </div>

                {/* Valor */}
                <div>
                  <p
                    className={`font-bold text-lg ${
                      transaction.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(
                        transaction.type
                      )}`}
                    ></div>
                    <span className="text-sm text-gray-300">
                      {getStatusLabel(transaction.type)}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {transactions.length > 10 && (
        <div className="flex justify-center mt-6">
          <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-white transition-colors">
            Ver todas as transações
          </button>
        </div>
      )}

      {transactions.length === 0 && !isLoading && (
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
