"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction } from "@/types/database";

interface YearlyChartsProps {
  transactions: Transaction[];
  year: number;
}

export function YearlyCharts({ transactions, year }: YearlyChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Dados para gráfico mensal do ano
  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map((month) => {
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month.getMonth()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, "MMM", { locale: ptBR }),
        fullMonth: format(month, "MMMM", { locale: ptBR }),
        income,
        expense,
        balance: income - expense,
      };
    });
  }, [transactions, year]);

  const yearlyTotals = useMemo(() => {
    const income = transactions
      .filter(
        (t) => t.type === "income" && new Date(t.date).getFullYear() === year
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(
        (t) => t.type === "expense" && new Date(t.date).getFullYear() === year
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  }, [transactions, year]);

  // Média mensal
  const monthlyAverage = useMemo(() => {
    const monthsWithData = monthlyData.filter(
      (m) => m.income > 0 || m.expense > 0
    );
    const avgIncome =
      monthsWithData.length > 0
        ? monthsWithData.reduce((sum, m) => sum + m.income, 0) /
          monthsWithData.length
        : 0;
    const avgExpense =
      monthsWithData.length > 0
        ? monthsWithData.reduce((sum, m) => sum + m.expense, 0) /
          monthsWithData.length
        : 0;

    return { income: avgIncome, expense: avgExpense };
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Resumo Anual */}
      <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Resumo Anual - {year}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Receitas Anuais</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(yearlyTotals.income)}
              </p>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Despesas Anuais</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(yearlyTotals.expense)}
              </p>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Saldo Anual</p>
              <p
                className={`text-2xl font-bold ${
                  yearlyTotals.balance >= 0 ? "text-blue-400" : "text-red-400"
                }`}
              >
                {formatCurrency(yearlyTotals.balance)}
              </p>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Média Mensal</p>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(monthlyAverage.income - monthlyAverage.expense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Evolução Mensal */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Evolução Mensal - {year}
            </h3>
            <p className="text-sm text-gray-400">
              Receitas, despesas e saldo por mês
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number, name: string) => {
                    const labels = {
                      income: "Receitas",
                      expense: "Despesas",
                      balance: "Saldo",
                    };
                    return [
                      formatCurrency(value),
                      labels[name as keyof typeof labels] || name,
                    ];
                  }}
                  labelFormatter={(label) => `Mês: ${label}`}
                  labelStyle={{ color: "#D1D5DB" }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#1DB954"
                  strokeWidth={3}
                  dot={{ fill: "#1DB954", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#1DB954", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Área - Fluxo de Caixa */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Fluxo de Caixa Acumulado
            </h3>
            <p className="text-sm text-gray-400">
              Saldo acumulado ao longo do ano
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData.map((item, index) => ({
                  ...item,
                  cumulativeBalance: monthlyData
                    .slice(0, index + 1)
                    .reduce((sum, month) => sum + month.balance, 0),
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Saldo Acumulado",
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  labelStyle={{ color: "#D1D5DB" }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeBalance"
                  stroke="#3B82F6"
                  fill="url(#colorBalance)"
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Análise Comparativa */}
      <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Análise Comparativa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-white mb-3">
              Melhores Meses
            </h4>
            <div className="space-y-2">
              {monthlyData
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 3)
                .map((month, index) => (
                  <div
                    key={month.month}
                    className="flex justify-between items-center p-3 bg-[#2a2a2a] rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                            ? "bg-gray-400 text-black"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">
                        {month.fullMonth}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        month.balance >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(month.balance)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-white mb-3">
              Maiores Gastos
            </h4>
            <div className="space-y-2">
              {monthlyData
                .sort((a, b) => b.expense - a.expense)
                .slice(0, 3)
                .map((month, index) => (
                  <div
                    key={month.month}
                    className="flex justify-between items-center p-3 bg-[#2a2a2a] rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">
                        {month.fullMonth}
                      </span>
                    </div>
                    <span className="font-bold text-red-400">
                      {formatCurrency(month.expense)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
