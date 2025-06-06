export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          color: string | null;
          icon: string | null;
          type: "income" | "expense";
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string | null;
          icon?: string | null;
          type: "income" | "expense";
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string | null;
          icon?: string | null;
          type?: "income" | "expense";
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          description: string;
          amount: number;
          type: "income" | "expense";
          category_id: string | null;
          date: string;
          user_id: string;
          is_installment: boolean;
          installment_count: number | null;
          installment_current: number | null;
          installment_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          type: "income" | "expense";
          category_id?: string | null;
          date: string;
          user_id: string;
          is_installment?: boolean;
          installment_count?: number | null;
          installment_current?: number | null;
          installment_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense";
          category_id?: string | null;
          date?: string;
          user_id?: string;
          is_installment?: boolean;
          installment_count?: number | null;
          installment_current?: number | null;
          installment_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          id: string;
          name: string;
          amount: number;
          category_id: string;
          period: "monthly" | "weekly" | "yearly";
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          category_id: string;
          period: "monthly" | "weekly" | "yearly";
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          category_id?: string;
          period?: "monthly" | "weekly" | "yearly";
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      transaction_shares: {
        Row: {
          id: string;
          transaction_id: string;
          shared_with_user_id: string;
          share_type: "equal" | "percentage" | "fixed_amount";
          share_value: number | null;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          shared_with_user_id: string;
          share_type: "equal" | "percentage" | "fixed_amount";
          share_value?: number | null;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          shared_with_user_id?: string;
          share_type?: "equal" | "percentage" | "fixed_amount";
          share_value?: number | null;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_shares_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_shares_shared_with_user_id_fkey";
            columns: ["shared_with_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          notification_shared_transactions: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          notification_shared_transactions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          notification_shared_transactions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Tipos auxiliares para facilitar o uso
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Tipos específicos das entidades
export type Transaction = Tables<"transactions">;
export type TransactionInsert = TablesInsert<"transactions">;
export type TransactionUpdate = TablesUpdate<"transactions">;

export type Category = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

export type Budget = Tables<"budgets">;
export type BudgetInsert = TablesInsert<"budgets">;
export type BudgetUpdate = TablesUpdate<"budgets">;

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

// Tipos específicos para transações compartilhadas
export type TransactionShare = Tables<"transaction_shares">;
export type TransactionShareInsert = TablesInsert<"transaction_shares">;
export type TransactionShareUpdate = TablesUpdate<"transaction_shares">;

// Tipos compostos
export type TransactionWithCategory = Transaction & {
  categories: Category;
};

export type CategoryWithTransactions = Category & {
  transactions: Transaction[];
};

export type TransactionWithShares = Transaction & {
  transaction_shares: (TransactionShare & {
    profiles: Pick<Profile, "full_name" | "email">;
  })[];
  calculated_user_amount?: number; // Valor calculado para o usuário atual
};

// Tipos para forms e validação
export type TransactionFormData = {
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id?: string;
  date: Date;
  is_installment: boolean;
  installment_count?: number;
};

export type CategoryFormData = {
  name: string;
  color?: string;
  icon?: string;
  type: "income" | "expense";
};

export type BudgetFormData = {
  name: string;
  amount: number;
  category_id: string;
  period: "monthly" | "weekly" | "yearly";
};

// Tipos para entrada de dados de compartilhamento
export type TransactionShareInput = {
  userId: string;
  shareType: "equal" | "percentage" | "fixed_amount";
  shareValue?: number;
};

// Tipos para liquidação de contas
export type Settlement = {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  transactions: string[]; // IDs das transações envolvidas
};

// Tipos para formulários de compartilhamento
export type ShareConfigFormData = {
  shares: TransactionShareInput[];
  notifyUsers: boolean;
};

// Tipos para resumo de compartilhamento
export type ShareSummary = {
  total_shared_transactions: number;
  pending_shares: number;
  accepted_shares: number;
  declined_shares: number;
  total_amount_shared: number;
  total_amount_received: number;
};
