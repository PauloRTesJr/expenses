"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { TransactionForm } from "@/components/forms/transaction-form";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { AdvancedCharts } from "@/components/dashboard/advanced-charts";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { TransactionFormData, Transaction, Category } from "@/types/database";
import { createClientSupabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Plus,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Wallet,
} from "lucide-react";

interface DashboardClientProps {
  user: User;
  categories: Array<{ id: string; name: string; type: "income" | "expense" }>;
}

interface TransactionWithCategory extends Transaction {
  category?: Category;
}

interface FilterState {
  month: Date;
  search: string;
  category_id?: string;
  type?: "income" | "expense" | "all";
}

export function DashboardClient({ user, categories }: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filters] = useState<FilterState>({
    month: new Date(),
    search: "",
    category_id: undefined,
    type: "all",
  });

  const supabase = createClientSupabase();

  // Buscar transações do banco de dados
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(*)
        `
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const transformedData: TransactionWithCategory[] = (data || []).map(
        (item) => ({
          ...item,
          category: item.category || undefined,
        })
      );

      setTransactions(transformedData);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filtrar transações baseado nos filtros ativos
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthStart = startOfMonth(filters.month);
      const monthEnd = endOfMonth(filters.month);

      const isInMonth =
        transactionDate >= monthStart && transactionDate <= monthEnd;

      const matchesSearch =
        filters.search === "" ||
        transaction.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesCategory =
        !filters.category_id || transaction.category_id === filters.category_id;

      const matchesType =
        filters.type === "all" || transaction.type === filters.type;

      return isInMonth && matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, filters]);

  // Calcular totais
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular crescimento mensal (mock data por enquanto)
    const monthlyGrowth = 15.2;

    return {
      income,
      expense,
      balance: income - expense,
      monthlyGrowth,
    };
  }, [filteredTransactions]);

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      if (data.is_installment && data.installment_count) {
        const installmentGroupId = crypto.randomUUID();
        const installmentAmount = data.amount / data.installment_count;

        const transactions = [];
        for (let i = 1; i <= data.installment_count; i++) {
          const installmentDate = new Date(data.date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

          transactions.push({
            description: `${data.description} (${i}/${data.installment_count})`,
            amount: installmentAmount,
            type: data.type,
            category_id: data.category_id || null,
            date: installmentDate.toISOString().split("T")[0],
            user_id: user.id,
            is_installment: true,
            installment_count: data.installment_count,
            installment_current: i,
            installment_group_id: installmentGroupId,
          });
        }

        const { error } = await supabase
          .from("transactions")
          .insert(transactions);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({
          description: data.description,
          amount: data.amount,
          type: data.type,
          category_id: data.category_id || null,
          date: data.date.toISOString().split("T")[0],
          user_id: user.id,
          is_installment: false,
        });

        if (error) throw error;
      }

      await fetchTransactions();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Erro ao salvar transação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header moderno */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e título */}
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Wallet className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  UI Art
                </h1>
                <p className="text-xs text-gray-400">Financial Dashboard</p>
              </div>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </motion.button>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                </motion.button>

                <div className="flex items-center space-x-3 pl-3 border-l border-gray-700">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">John Doe</p>
                    <p className="text-xs text-gray-400">Product Designer</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                </div>

                <form action="/auth/signout" method="post">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    type="submit"
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
            Painel de Controle Financeiro
          </h2>
          <p className="text-gray-400 text-lg">
            Monitore seus resultados e tome decisões financeiras inteligentes
          </p>
        </motion.div>

        {/* Metrics Cards */}
        <MetricsCards
          totalIncome={totals.income}
          totalExpenses={totals.expense}
          balance={totals.balance}
          monthlyGrowth={totals.monthlyGrowth}
        />

        {/* Advanced Charts */}
        <AdvancedCharts
          transactions={transactions}
        />

        {/* Transaction History */}
        <TransactionHistory
          transactions={filteredTransactions}
          isLoading={isLoading}
        />
      </main>

      {/* Transaction Modal */}
      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        categories={categories}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
