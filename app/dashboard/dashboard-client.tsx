"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import { MonthlyCharts } from "@/components/dashboard/monthly-charts";
import { YearlyCharts } from "@/components/dashboard/yearly-charts";
import { TransactionFormData, Transaction, Category } from "@/types/database";
import { createClientSupabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [filters, setFilters] = useState<FilterState>({
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

      // Transformar os dados para corresponder ao tipo esperado
      const transformedData: TransactionWithCategory[] = (data || []).map(
        (item) => ({
          ...item,
          category: item.category || undefined, // Converter null para undefined
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

      // Filtro por mês
      const isInMonth =
        transactionDate >= monthStart && transactionDate <= monthEnd;

      // Filtro por busca
      const matchesSearch =
        filters.search === "" ||
        transaction.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      // Filtro por categoria
      const matchesCategory =
        !filters.category_id || transaction.category_id === filters.category_id;

      // Filtro por tipo
      const matchesType =
        filters.type === "all" || transaction.type === filters.type;

      return isInMonth && matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, filters]);

  // Calcular totais do mês atual
  const monthlyTotals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      if (data.is_installment && data.installment_count) {
        // Para transações parceladas, criar múltiplas transações
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
        // Transação única
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

      // Recarregar transações
      await fetchTransactions();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Erro ao salvar transação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-[#1e1e1e] shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">Expenses</h1>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Nova Transação
              </Button>
              <div className="text-sm text-gray-300">
                Bem-vindo,{" "}
                <span className="text-white font-medium">{user.email}</span>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-400 hover:text-[#1DB954] transition-colors font-medium"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Painel Financeiro
            </h2>
            <p className="text-gray-300 text-lg">
              Controle total sobre suas receitas e despesas
            </p>
          </div>

          {/* Stats Cards - Atualizados com dados reais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Receitas</p>
                  <p className="text-2xl font-bold text-[#1DB954]">
                    {formatCurrency(monthlyTotals.income)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(filters.month, "MMMM yyyy")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#1DB954]"
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
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(monthlyTotals.expense)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(filters.month, "MMMM yyyy")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-400"
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
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Saldo</p>
                  <p
                    className={`text-2xl font-bold ${
                      monthlyTotals.balance >= 0
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(monthlyTotals.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(filters.month, "MMMM yyyy")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <TransactionFilters
            onFilterChange={setFilters}
            categories={categories}
          />

          {/* Abas para visualização */}
          <div className="mb-6">
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-1 inline-flex">
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "monthly"
                    ? "bg-[#1DB954] text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Visão Mensal
              </button>
              <button
                onClick={() => setActiveTab("yearly")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "yearly"
                    ? "bg-[#1DB954] text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Visão Anual
              </button>
            </div>
          </div>

          {/* Conteúdo baseado na aba ativa */}
          {activeTab === "monthly" ? (
            <div className="space-y-6">
              {/* Lista de Transações */}
              <TransactionsList
                transactions={filteredTransactions}
                isLoading={isLoading}
              />

              {/* Gráficos Mensais */}
              <MonthlyCharts
                transactions={filteredTransactions}
                month={filters.month}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gráficos Anuais */}
              <YearlyCharts
                transactions={transactions}
                year={filters.month.getFullYear()}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal de Nova Transação */}
      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        categories={categories}
      />
    </div>
  );
}
