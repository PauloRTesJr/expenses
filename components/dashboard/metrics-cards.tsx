"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

interface MetricsCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyGrowth: number;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MetricsCards({
  totalIncome,
  totalExpenses,
  balance,
  monthlyGrowth,
  currentMonth,
  onMonthChange,
}: MetricsCardsProps) {
  const { locale, t } = useLocale();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
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
      title: t("metrics.selectedPeriod"),
      value: currentMonth.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      }),
      isMonthSelector: true,
      icon: Calendar,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20",
    },
    {
      title: t("metrics.totalIncome"),
      value: formatCurrency(totalIncome),
      percentage: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
      trend: "up",
    },
    {
      title: t("metrics.totalExpenses"),
      value: formatCurrency(totalExpenses),
      percentage: "-4.2%",
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
      trend: "down",
    },
    {
      title: t("metrics.totalProfit"),
      value: formatCurrency(balance),
      percentage: formatPercentage(monthlyGrowth),
      icon: DollarSign,
      color: balance >= 0 ? "text-blue-400" : "text-red-400",
      bgColor: balance >= 0 ? "bg-blue-400/10" : "bg-red-400/10",
      borderColor: balance >= 0 ? "border-blue-400/20" : "border-red-400/20",
      trend: balance >= 0 ? "up" : "down",
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
              {card.isMonthSelector ? (
                // Month Selector Card
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor}`}
                    >
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-3">
                      {card.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePreviousMonth}
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </motion.button>

                      <p className="text-lg font-bold text-white capitalize text-center flex-1">
                        {card.value}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                // Regular metric cards
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor}`}
                    >
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    {card.percentage && (
                      <div
                        className={`flex items-center text-sm font-medium ${
                          card.trend === "up"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {card.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {card.percentage}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                      {card.value}
                    </p>
                  </div>
                </>
              )}
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
