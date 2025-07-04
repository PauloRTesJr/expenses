"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TransactionFiltersProps {
  onFilterChange: (filters: {
    month: Date;
    search: string;
    category_id?: string;
    type?: "income" | "expense" | "all";
  }) => void;
  categories: Array<{ id: string; name: string; type: "income" | "expense" }>;
}

export function TransactionFilters({
  onFilterChange,
  categories,
}: TransactionFiltersProps) {
  const [month, setMonth] = useState(new Date());
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [type, setType] = useState<"income" | "expense" | "all">("all");
  const { locale, t } = useLocale();

  const handleFilterChange = () => {
    onFilterChange({
      month,
      search,
      category_id: categoryId,
      type,
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(month);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setMonth(newMonth);
    onFilterChange({
      month: newMonth,
      search,
      category_id: categoryId,
      type,
    });
  };

  const resetFilters = () => {
    const now = new Date();
    setMonth(now);
    setSearch("");
    setCategoryId(undefined);
    setType("all");
    onFilterChange({
      month: now,
      search: "",
      category_id: undefined,
      type: "all",
    });
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-800 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t("filters.title")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Navegação de Mês */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t("filters.period")}
          </label>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
            >
              ←
            </Button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-white">
                {month.toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
            >
              →
            </Button>
          </div>
        </div>

        {/* Busca por Nome */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t("filters.searchLabel")}
          </label>
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t("filters.type")}
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as "income" | "expense" | "all");
              handleFilterChange();
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="income">{t("filters.income")}</option>
            <option value="expense">{t("filters.expense")}</option>
          </select>
        </div>

        {/* Filtro por Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t("filters.category")}
          </label>
          <select
            value={categoryId || ""}
            onChange={(e) => {
              setCategoryId(e.target.value || undefined);
              handleFilterChange();
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
          >
            <option value="">{t("filters.allCategories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão de Reset */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="secondary"
          onClick={resetFilters}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
        >
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
}
