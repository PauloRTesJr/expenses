"use client";
import { LoginForm } from "@/components/forms/login-form";
import { useLocale } from "@/components/providers/locale-provider";

export default function LoginPage() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#232949] via-[#764ba2] to-[#0f1419]">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary text-white rounded-full mb-6 shadow-2xl">
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
            {t("login.welcome")}
          </h1>
          <p className="text-gray-300 text-lg">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card-glass">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-300">
            {t("login.dontHaveAccount")} {" "}
            <a
              href="/register"
              className="text-[#8b5cf6] hover:text-[#764ba2] font-medium transition-colors"
            >
              {t("login.createAccount")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 