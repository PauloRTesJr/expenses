// Configurações e constantes do Supabase
export const supabaseConfig = {
  url:
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://projeto-mock.supabase.co",
  anonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2pldG8tbW9jayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjIwMTk2NDMyMDB9.mock-anon-key",
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2pldG8tbW9jayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MjAxOTY0MzIwMH0.mock-service-role-key",
} as const;

// Validar se as variáveis de ambiente estão configuradas
export const validateSupabaseConfig = () => {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL não está definido");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definido");
  }

  if (errors.length > 0) {
    console.log("supabase config errors", errors);
    console.log("usando valores mockados para desenvolvimento");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Configurações de autenticação
export const authConfig = {
  redirectTo: {
    login: "/login",
    logout: "/",
    afterLogin: "/dashboard",
    afterSignup: "/dashboard",
  },
  providers: {
    email: true,
    google: false, // Habilitar quando configurado
    github: false, // Habilitar quando configurado
  },
} as const;

// Configurações de RLS (Row Level Security)
export const rlsPolicies = {
  tables: {
    transactions: {
      select: "auth.uid() = user_id",
      insert: "auth.uid() = user_id",
      update: "auth.uid() = user_id",
      delete: "auth.uid() = user_id",
    },
    categories: {
      select: "auth.uid() = user_id",
      insert: "auth.uid() = user_id",
      update: "auth.uid() = user_id",
      delete: "auth.uid() = user_id",
    },
    budgets: {
      select: "auth.uid() = user_id",
      insert: "auth.uid() = user_id",
      update: "auth.uid() = user_id",
      delete: "auth.uid() = user_id",
    },
    profiles: {
      select: "auth.uid() = id",
      insert: "auth.uid() = id",
      update: "auth.uid() = id",
      delete: "auth.uid() = id",
    },
  },
} as const;

// Mensagens de erro padrão
export const errorMessages = {
  auth: {
    invalidCredentials: "Email ou senha inválidos",
    emailNotConfirmed: "Por favor, confirme seu email antes de fazer login",
    weakPassword: "A senha deve ter pelo menos 6 caracteres",
    emailAlreadyInUse: "Este email já está em uso",
    userNotFound: "Usuário não encontrado",
    sessionExpired: "Sua sessão expirou. Faça login novamente",
  },
  database: {
    connectionError: "Erro de conexão com o banco de dados",
    notFound: "Registro não encontrado",
    unauthorized: "Você não tem permissão para realizar esta ação",
    validationError: "Dados inválidos",
  },
  general: {
    internalError: "Erro interno do servidor",
    networkError: "Erro de conexão. Verifique sua internet",
  },
} as const;
