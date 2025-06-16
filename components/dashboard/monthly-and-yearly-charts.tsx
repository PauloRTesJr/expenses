"use client";

import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Transaction } from "@/types/database";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useMemo } from "react";

export interface MonthlyAndYearlyChartsProps {
  transactions: Transaction[];
  currentMonth: Date;
}

interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export function MonthlyAndYearlyCharts({
  transactions,
  currentMonth,
}: MonthlyAndYearlyChartsProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(1)}K`;
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Dados para o gráfico mensal (últimos 12 meses)
  const monthlyData = useMemo(() => {
    const earningsData = [];
    const date = new Date(currentMonth);

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === monthDate.getMonth() &&
          transactionDate.getFullYear() === monthDate.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      earningsData.push({
        month: monthDate.toLocaleDateString("pt-BR", { month: "short" }),
        income: income / 1000,
        expense: expense / 1000,
        profit: (income - expense) / 1000,
      });
    }

    return earningsData;
  }, [transactions, currentMonth]);

  // Calcular totais anuais
  const annualTotals = useMemo(() => {
    const currentYear = currentMonth.getFullYear();
    const yearTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear;
    });

    const income = yearTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = yearTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    // Calcular médias mensais
    const monthsElapsed = currentMonth.getMonth() + 1; // Meses já passados no ano
    const avgMonthlyIncome = monthsElapsed > 0 ? income / monthsElapsed : 0;
    const avgMonthlyExpense = monthsElapsed > 0 ? expense / monthsElapsed : 0;

    return {
      income,
      expense,
      balance,
      avgMonthlyIncome,
      avgMonthlyExpense,
      monthsElapsed,
    };
  }, [transactions, currentMonth]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{`Mês: ${label}`}</p>
          {payload.map((entry: TooltipPayload, index: number) => (
            <p
              key={index}
              className="text-sm font-medium"
              style={{ color: entry.color }}
            >
              {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Resultados Mensais */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Resultados Mensais
            </h3>
            <p className="text-sm text-gray-400">
              Evolução dos últimos 12 meses
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-400">Receitas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-400">Despesas</span>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Resultados Anuais - Card Informativo */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Resultados Anuais
              </h3>
              <p className="text-sm text-gray-400">
                Resumo do ano {currentMonth.getFullYear()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Meses considerados</p>
            <p className="text-sm font-medium text-white">
              {annualTotals.monthsElapsed} de 12
            </p>
          </div>
        </div>

        {/* Cards de totais anuais */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Receitas Anuais */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Média mensal</p>
                <p className="text-sm font-medium text-green-400">
                  {formatCurrencyFull(annualTotals.avgMonthlyIncome)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Receitas Totais</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrencyFull(annualTotals.income)}
              </p>
            </div>
          </motion.div>

          {/* Despesas Anuais */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Média mensal</p>
                <p className="text-sm font-medium text-red-400">
                  {formatCurrencyFull(annualTotals.avgMonthlyExpense)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Despesas Totais</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrencyFull(annualTotals.expense)}
              </p>
            </div>
          </motion.div>

          {/* Saldo Anual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className={`bg-gradient-to-br ${
              annualTotals.balance >= 0
                ? "from-blue-500/10 to-blue-600/5 border-blue-500/20"
                : "from-orange-500/10 to-orange-600/5 border-orange-500/20"
            } border rounded-xl p-4 hover:shadow-lg ${
              annualTotals.balance >= 0
                ? "hover:shadow-blue-500/10"
                : "hover:shadow-orange-500/10"
            } transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${
                  annualTotals.balance >= 0
                    ? "bg-blue-500/20"
                    : "bg-orange-500/20"
                } rounded-xl flex items-center justify-center`}
              >
                <DollarSign
                  className={`w-5 h-5 ${
                    annualTotals.balance >= 0
                      ? "text-blue-400"
                      : "text-orange-400"
                  }`}
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Status</p>
                <p
                  className={`text-sm font-medium ${
                    annualTotals.balance >= 0
                      ? "text-blue-400"
                      : "text-orange-400"
                  }`}
                >
                  {annualTotals.balance >= 0 ? "Positivo" : "Negativo"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Saldo Total</p>
              <p
                className={`text-2xl font-bold ${
                  annualTotals.balance >= 0
                    ? "text-blue-400"
                    : "text-orange-400"
                }`}
              >
                {formatCurrencyFull(annualTotals.balance)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
          <div className="text-center p-3 bg-gray-800/20 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Taxa de Economia</p>
            <p className="text-lg font-bold text-purple-400">
              {annualTotals.income > 0
                ? ((annualTotals.balance / annualTotals.income) * 100).toFixed(
                    1
                  )
                : "0.0"}
              %
            </p>
          </div>
          <div className="text-center p-3 bg-gray-800/20 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Projeção Anual</p>
            <p className="text-lg font-bold text-cyan-400">
              {formatCurrencyFull(
                annualTotals.balance * (12 / annualTotals.monthsElapsed)
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
