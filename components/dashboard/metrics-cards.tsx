"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface MetricsCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyGrowth: number;
}

export function MetricsCards({
  totalIncome,
  totalExpenses,
  balance,
  monthlyGrowth,
}: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const cards = [
    {
      title: "Total de Receitas",
      value: formatCurrency(totalIncome),
      percentage: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
      trend: "up",
    },
    {
      title: "Total de Despesas",
      value: formatCurrency(totalExpenses),
      percentage: "-4.2%",
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
      trend: "down",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(balance),
      percentage: formatPercentage(monthlyGrowth),
      icon: DollarSign,
      color: balance >= 0 ? "text-blue-400" : "text-red-400",
      bgColor: balance >= 0 ? "bg-blue-400/10" : "bg-red-400/10",
      borderColor: balance >= 0 ? "border-blue-400/20" : "border-red-400/20",
      trend: balance >= 0 ? "up" : "down",
    },
    {
      title: "Meta Mensal",
      value: formatCurrency(5000),
      percentage: "+8.1%",
      icon: Target,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
            className={`relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border ${
              card.borderColor
            } rounded-2xl p-6 group hover:shadow-2xl hover:shadow-${
              card.color.split("-")[1]
            }-500/10 transition-all duration-300`}
          >
            {/* Background gradient effect */}
            <div
              className={`absolute inset-0 ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor}`}
                >
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    card.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {card.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {card.percentage}
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                  {card.value}
                </p>
              </div>
            </div>

            {/* Animated border effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div
                className={`absolute inset-0 rounded-2xl border-2 ${card.borderColor} animate-pulse`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
