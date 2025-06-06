import { z } from "zod";

// Validações para transações
export const TransactionSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(255, "Descrição muito longa"),
  amount: z
    .number()
    .positive("Valor deve ser positivo")
    .max(999999.99, "Valor muito alto"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipo é obrigatório",
    invalid_type_error: "Tipo deve ser 'income' ou 'expense'",
  }),
  category_id: z.string().uuid("ID da categoria inválido"),
  date: z
    .date({
      required_error: "Data é obrigatória",
      invalid_type_error: "Data inválida",
    })
    .max(new Date(), "Data não pode ser futura"),
});

export const TransactionFormSchema = TransactionSchema.omit({
  category_id: true,
}).extend({
  categoryId: z.string().min(1, "Categoria é obrigatória"),
});

// Validações para categorias
export const CategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal (#RRGGBB)")
    .optional(),
  icon: z.string().max(50, "Nome do ícone muito longo").optional(),
  type: z.enum(["income", "expense"], {
    required_error: "Tipo é obrigatório",
    invalid_type_error: "Tipo deve ser 'income' ou 'expense'",
  }),
});

// Validações para orçamentos
export const BudgetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  amount: z
    .number()
    .positive("Valor deve ser positivo")
    .max(999999.99, "Valor muito alto"),
  category_id: z.string().uuid("ID da categoria inválido"),
  period: z.enum(["monthly", "weekly", "yearly"], {
    required_error: "Período é obrigatório",
    invalid_type_error: "Período inválido",
  }),
});

export const BudgetFormSchema = BudgetSchema.omit({
  category_id: true,
}).extend({
  categoryId: z.string().min(1, "Categoria é obrigatória"),
});

// Validações para perfil de usuário
export const ProfileSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  full_name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .optional(),
  avatar_url: z.string().url("URL do avatar inválida").optional(),
});

// Validações para autenticação
export const LoginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha muito longa"),
});

export const RegisterSchema = LoginSchema.extend({
  confirmPassword: z
    .string()
    .min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
  full_name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(100, "Senha muito longa"),
    confirmPassword: z
      .string()
      .min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

// Validações para filtros e consultas
export const TransactionFiltersSchema = z
  .object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(["income", "expense"]).optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().optional(),
    search: z.string().max(255).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "Data inicial deve ser anterior à data final",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.minAmount && data.maxAmount) {
        return data.minAmount <= data.maxAmount;
      }
      return true;
    },
    {
      message: "Valor mínimo deve ser menor que o valor máximo",
      path: ["maxAmount"],
    }
  );

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["date", "amount", "description", "created_at"])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Tipos inferidos dos schemas
export type TransactionFormData = z.infer<typeof TransactionFormSchema>;
export type CategoryFormData = z.infer<typeof CategorySchema>;
export type BudgetFormData = z.infer<typeof BudgetFormSchema>;
export type ProfileFormData = z.infer<typeof ProfileSchema>;
export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;

// Utilitários para validação
export const validateTransaction = (data: unknown) => {
  return TransactionSchema.safeParse(data);
};

export const validateCategory = (data: unknown) => {
  return CategorySchema.safeParse(data);
};

export const validateBudget = (data: unknown) => {
  return BudgetSchema.safeParse(data);
};

export const validateProfile = (data: unknown) => {
  return ProfileSchema.safeParse(data);
};

export const validateLogin = (data: unknown) => {
  return LoginSchema.safeParse(data);
};

export const validateRegister = (data: unknown) => {
  return RegisterSchema.safeParse(data);
};
