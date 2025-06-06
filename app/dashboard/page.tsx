import { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-[#1e1e1e] shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">
                  Expenses
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-300">
                Bem-vindo, <span className="text-white font-medium">{user.email}</span>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-400 hover:text-[#1DB954] transition-colors font-medium"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Seu Painel Financeiro
            </h2>
            <p className="text-gray-300 text-lg">
              Tenha controle total sobre suas finanças pessoais
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Receitas</p>
                  <p className="text-2xl font-bold text-[#1DB954]">R$ 0,00</p>
                </div>
                <div className="w-12 h-12 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">R$ 0,00</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Saldo</p>
                  <p className="text-2xl font-bold text-white">R$ 0,00</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#1DB954]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-[#1DB954]"
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
              <h3 className="text-2xl font-bold text-white mb-3">
                Dashboard em Construção
              </h3>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                Seu painel financeiro está sendo desenvolvido. Em breve você poderá visualizar suas transações e relatórios aqui.
              </p>
              <button className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105">
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 