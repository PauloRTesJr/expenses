import { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard - Expenses",
  description: "Painel de controle financeiro",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar categorias do banco de dados
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", user.id);

  return <DashboardClient user={user} categories={categories || []} />;
}
