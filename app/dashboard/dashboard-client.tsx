"use client";

import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { TransactionForm } from "@/components/forms/transaction-form";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import dynamic from "next/dynamic";
import type { MonthlyAndYearlyChartsProps } from "@/components/dashboard/monthly-and-yearly-charts";
const MonthlyAndYearlyCharts = dynamic<MonthlyAndYearlyChartsProps>(
  () =>
    import("@/components/dashboard/monthly-and-yearly-charts").then(
      (mod) => mod.MonthlyAndYearlyCharts
    ),
  { ssr: false }
);
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useProfile } from "@/hooks/use-profile";
import { useLocale } from "@/components/providers/locale-provider";
import { TransactionFormData, TransactionShareInput } from "@/types/database";
import { TransactionWithCategoryAndShares } from "@/types/shared-transactions";
import { createClientSupabase } from "@/lib/supabase/client";
import { TransactionsService } from "@/lib/transactions/service";
import { User } from "@supabase/supabase-js";
import { Plus, Bell, Search, LogOut, Wallet, Users } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { SharedSummaryModal } from "@/components/dashboard/shared-summary-modal";

interface DashboardClientProps {
  user: User;
  categories: Array<{ id: string; name: string; type: "income" | "expense" }>;
}

interface FilterState {
  month: Date;
  search: string;
  category_id?: string;
  type?: "income" | "expense" | "all";
}

export function DashboardClient(props: DashboardClientProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardInner {...props} />
    </QueryClientProvider>
  );
}

function DashboardInner({ user, categories }: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const { data: transactions = [], isLoading } = useQuery<
    TransactionWithCategoryAndShares[]
  >({
    queryKey: ["transactions", user.id],
    queryFn: () => TransactionsService.fetchTransactionsWithShares(user.id),
  });
  const [filters, setFilters] = useState<FilterState>({
    month: new Date(),
    search: "",
    category_id: undefined,
    type: "all",
  });

  // Profile hook for avatar and fullname
  const { profile, loading: profileLoading } = useProfile();

  const supabase = createClientSupabase();

  // Filtrar transações baseado nos filtros ativos
  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (transaction: TransactionWithCategoryAndShares) => {
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
          !filters.category_id ||
          transaction.category_id === filters.category_id;

        const matchesType =
          filters.type === "all" || transaction.type === filters.type;

        return isInMonth && matchesSearch && matchesCategory && matchesType;
      }
    );
  }, [transactions, filters]);

  // Calcular totais
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t: TransactionWithCategoryAndShares) => t.type === "income")
      .reduce(
        (sum: number, t: TransactionWithCategoryAndShares) => sum + t.amount,
        0
      );

    const expense = filteredTransactions
      .filter((t: TransactionWithCategoryAndShares) => t.type === "expense")
      .reduce(
        (sum: number, t: TransactionWithCategoryAndShares) => sum + t.amount,
        0
      );

    // Calcular crescimento mensal (mock data por enquanto)
    const monthlyGrowth = 15.2;

    return {
      income,
      expense,
      balance: income - expense,
      monthlyGrowth,
    };
  }, [filteredTransactions]);
  const handleTransactionSubmit = async (
    data: TransactionFormData & { shares?: TransactionShareInput[] }
  ) => {
    console.log('[DEBUG] handleTransactionSubmit called with:', data);
    try {
      if (data.shares && data.shares.length > 0) {
        // Usar a nova função para transações compartilhadas
        await TransactionsService.createSharedTransaction(
          data,
          data.shares,
          user.id
        );
      } else if (data.is_installment && data.installment_count) {
        // Lógica existente para parcelas sem compartilhamento
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
        // Lógica existente para transações simples sem compartilhamento
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

      await queryClient.invalidateQueries({
        queryKey: ["transactions", user.id],
      });
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
              <LocaleSwitcher />
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Wallet className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {t("dashboard.title")}
                </h1>
                <p className="text-xs text-gray-400">{t("dashboard.subtitle")}</p>
              </div>
            </div>
            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t("dashboard.searchPlaceholder")}
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t("dashboard.newTransaction")}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSharedModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>{t("dashboard.calculateShared")}</span>
              </motion.button>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                </motion.button>{" "}
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-700">
                  <div className="text-right">
                    {profileLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-700 rounded w-24"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white">
                          {profile?.full_name ||
                            user.email?.split("@")[0] ||
                            t("dashboard.userFallback")}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </>
                    )}
                  </div>
                  {profileLoading ? (
                    <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                  ) : (
                    <UserAvatar
                      src={profile?.avatar_url}
                      alt={profile?.full_name || t("dashboard.userAvatarAlt")}
                      size="md"
                      fallbackText={profile?.full_name || user.email}
                      className="border-2 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                    />
                  )}
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
        {/* Metrics Cards */}
        <MetricsCards
          totalIncome={totals.income}
          totalExpenses={totals.expense}
          balance={totals.balance}
          monthlyGrowth={totals.monthlyGrowth}
          currentMonth={filters.month}
          onMonthChange={(newMonth) =>
            setFilters((prev) => ({ ...prev, month: newMonth }))
          }
        />{" "}
        {/* Transaction History */}
        <TransactionHistory
          transactions={filteredTransactions}
          isLoading={isLoading}
          currentUserId={user.id}
        />
        {/* Monthly and Yearly Charts - Side by Side */}
        <MonthlyAndYearlyCharts
          transactions={transactions}
          currentMonth={filters.month}
        />
      </main>

      {/* Transaction Modal */}
      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        categories={categories}
      />

      <SharedSummaryModal
        isOpen={isSharedModalOpen}
        onClose={() => setIsSharedModalOpen(false)}
        transactions={transactions}
        currentUserId={user.id}
        month={filters.month}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
