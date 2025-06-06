"use client";

import { Transaction } from "@/types/database";

interface AdvancedChartsProps {
  transactions: Transaction[];
  currentMonth: Date;
}

export function AdvancedCharts({
  transactions,
  currentMonth,
}: AdvancedChartsProps) {
  // Componente removido - funcionalidade movida para MonthlyAndYearlyCharts
  return null;
}
