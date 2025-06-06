"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Transaction, Category } from "@/types/database";

interface ExpensesDonutChartProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: Date;
}

interface CategoryExpense {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon?: string;
}

export function ExpensesDonutChart({
  transactions,
  categories,
  currentMonth,
}: ExpensesDonutChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcular despesas por categoria do mês atual
  const categoryExpenses = useMemo(() => {
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Filtrar apenas despesas do mês atual
    const monthExpenses = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === "expense" &&
        transactionDate >= monthStart &&
        transactionDate <= monthEnd
      );
    });

    // Agrupar por categoria
    const expensesByCategory = monthExpenses.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || "uncategorized";
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calcular total para percentuais
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, amount) => sum + amount,
      0
    );

    if (totalExpenses === 0) return [];

    // Criar dados para o gráfico
    const categoryData: CategoryExpense[] = Object.entries(expensesByCategory)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        const percentage = (amount / totalExpenses) * 100;

        return {
          name: category?.name || "Sem categoria",
          value: amount,
          percentage,
          color: category?.color || "#6B7280",
          icon: category?.icon || undefined,
        };
      })
      .sort((a, b) => b.value - a.value) // Ordenar por valor decrescente
      .slice(0, 6); // Mostrar apenas top 6 categorias

    return categoryData;
  }, [transactions, categories, currentMonth]);

  const totalExpenses = categoryExpenses.reduce(
    (sum, category) => sum + category.value,
    0
  );

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        percentage: number;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm font-medium">{data.name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-white font-bold">{formatCurrency(data.value)}</p>
            <span className="text-gray-400 text-xs">
              ({data.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
            Categorias de Despesas
          </h3>
          <p className="text-sm text-gray-400">
            Total: {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      {categoryExpenses.length > 0 ? (
        <>
          {/* Donut Chart */}
          <div className="h-48 relative mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold text-white">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {categoryExpenses.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {item.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">
              Nenhuma despesa encontrada
            </h4>
            <p className="text-gray-400 text-sm">
              Adicione algumas despesas para ver o gráfico
            </p>
          </div>
        </div>
      )}

      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/20 animate-pulse" />
      </div>
    </motion.div>
  );
}
