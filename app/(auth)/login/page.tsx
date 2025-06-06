import { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login - Expenses",
  description: "Faça login na sua conta do Expenses",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1DB954] text-black rounded-full mb-6 shadow-2xl">
            <svg
              className="w-10 h-10"
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
          <h1 className="text-4xl font-bold text-white mb-3">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-300 text-lg">
            Entre na sua conta para continuar gerenciando suas finanças
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl p-8 border border-gray-800">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-300">
            Não tem uma conta?{" "}
            <a
              href="/register"
              className="text-[#1DB954] hover:text-[#1ed760] font-medium transition-colors"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 