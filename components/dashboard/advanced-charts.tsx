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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Transaction } from "@/types/database";

interface AdvancedChartsProps {
  transactions: Transaction[];
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

export function AdvancedCharts({ transactions }: AdvancedChartsProps) {
  // Preparar dados para o gráfico de earnings (linha)
  const earningsData = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    earningsData.push({
      month: date.toLocaleDateString("pt-BR", { month: "short" }),
      income: income / 1000, // Converter para milhares
      expense: expense / 1000,
      profit: (income - expense) / 1000,
    });
  }

  // Dados para status de vendas (pie chart)
  const statusData = [
    { name: "Ativo", value: 45, color: "#8b5cf6" },
    { name: "Completo", value: 35, color: "#3b82f6" },
    { name: "Em espera", value: 20, color: "#ef4444" },
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(1)}K`;
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Earnings Chart - Ocupa 2 colunas */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="lg:col-span-2 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Resultados</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Receita Atual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Despesa do Mês Passado</span>
              </div>
            </div>
          </div>
          <select className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
            <option>Anual</option>
            <option>Mensal</option>
            <option>Semanal</option>
          </select>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earningsData}>
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

      {/* Status de Vendas - Pie Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Status de Vendas</h3>
          <select className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white">
            <option>Mensal</option>
          </select>
        </div>

        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Percentual"]}
                contentStyle={{
                  backgroundColor: "rgba(31, 41, 55, 0.95)",
                  border: "1px solid #4b5563",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 mt-4">
          {statusData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-400">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
