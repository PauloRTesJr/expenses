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

// Validações para transações compartilhadas
export const TransactionShareSchema = z.object({
  userId: z.string().uuid("ID do usuário inválido"),
  shareType: z.enum(["equal", "percentage", "fixed_amount"], {
    required_error: "Tipo de compartilhamento é obrigatório",
    invalid_type_error: "Tipo de compartilhamento inválido",
  }),
  shareValue: z
    .number()
    .positive("Valor deve ser positivo")
    .optional()
    .refine(
      (value, ctx) => {
        const shareType = ctx.parent.shareType;
        if (shareType === "equal") {
          return value === undefined || value === null;
        }
        if (shareType === "percentage") {
          return value !== undefined && value > 0 && value <= 1;
        }
        if (shareType === "fixed_amount") {
          return value !== undefined && value > 0;
        }
        return true;
      },
      {
        message: "Valor inválido para o tipo de compartilhamento selecionado",
      }
    ),
});

export const ShareConfigFormSchema = z.object({
  shares: z
    .array(TransactionShareSchema)
    .min(1, "Pelo menos um compartilhamento é obrigatório")
    .max(10, "Máximo de 10 usuários por compartilhamento")
    .refine(
      (shares) => {
        // Validar que não há usuários duplicados
        const userIds = shares.map((share) => share.userId);
        return new Set(userIds).size === userIds.length;
      },
      {
        message:
          "Não é possível compartilhar com o mesmo usuário mais de uma vez",
      }
    )
    .refine(
      (shares) => {
        // Validar que a soma das porcentagens não excede 100%
        const totalPercentage = shares
          .filter((share) => share.shareType === "percentage")
          .reduce((sum, share) => sum + (share.shareValue || 0), 0);
        return totalPercentage <= 1;
      },
      {
        message: "A soma das porcentagens não pode exceder 100%",
      }
    ),
  notifyUsers: z.boolean().default(true),
});

export const UpdateShareStatusSchema = z.object({
  shareId: z.string().uuid("ID do compartilhamento inválido"),
  status: z.enum(["accepted", "declined"], {
    required_error: "Status é obrigatório",
    invalid_type_error: "Status deve ser 'accepted' ou 'declined'",
  }),
});

export const SharedTransactionQuerySchema = z.object({
  status: z.enum(["pending", "accepted", "declined"]).optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z
    .string()
    .datetime()
    .optional()
    .or(z.date().transform((date) => date.toISOString())),
  dateTo: z
    .string()
    .datetime()
    .optional()
    .or(z.date().transform((date) => date.toISOString())),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const UserSearchSchema = z.object({
  query: z
    .string()
    .min(2, "Busca deve ter pelo menos 2 caracteres")
    .max(100, "Busca muito longa"),
  excludeUsers: z.array(z.string().uuid()).optional(),
  limit: z.number().int().positive().max(20).default(10),
});

// Schema para validação de cálculo de compartilhamento
export const ShareCalculationSchema = z
  .object({
    transactionAmount: z
      .number()
      .positive("Valor da transação deve ser positivo"),
    shares: z.array(TransactionShareSchema),
  })
  .refine(
    (data) => {
      const { transactionAmount, shares } = data;

      // Calcular total de valores fixos
      const totalFixed = shares
        .filter((share) => share.shareType === "fixed_amount")
        .reduce((sum, share) => sum + (share.shareValue || 0), 0);

      // Calcular total de porcentagens
      const totalPercentage = shares
        .filter((share) => share.shareType === "percentage")
        .reduce((sum, share) => sum + (share.shareValue || 0), 0);

      // Verificar se valores fixos + porcentagens não excedem o valor total
      const percentageAmount = transactionAmount * totalPercentage;
      return totalFixed + percentageAmount <= transactionAmount;
    },
    {
      message:
        "A soma dos valores fixos e porcentagens não pode exceder o valor total da transação",
    }
  );

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
export type TransactionShareFormData = z.infer<typeof TransactionShareSchema>;
export type ShareConfigFormData = z.infer<typeof ShareConfigFormSchema>;
export type UpdateShareStatusFormData = z.infer<typeof UpdateShareStatusSchema>;
export type SharedTransactionQueryData = z.infer<
  typeof SharedTransactionQuerySchema
>;
export type UserSearchFormData = z.infer<typeof UserSearchSchema>;
export type ShareCalculationFormData = z.infer<typeof ShareCalculationSchema>;

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
