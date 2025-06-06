import { Transaction, Profile, TransactionShare as DatabaseTransactionShare } from "./database";

// Tipos específicos para transações compartilhadas
export interface TransactionShare {
  id: string;
  transaction_id: string;
  shared_with_user_id: string;
  share_type: "equal" | "percentage" | "fixed_amount";
  share_value: number | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface TransactionWithShares extends Transaction {
  transaction_shares: (TransactionShare & {
    profiles: Pick<Profile, "full_name" | "email">;
  })[];
  calculated_user_amount?: number; // Valor calculado para o usuário atual
}

export interface TransactionShareInput {
  userId: string;
  shareType: "equal" | "percentage" | "fixed_amount";
  shareValue?: number;
}

export interface Settlement {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  transactions: string[]; // IDs das transações envolvidas
}

export interface ShareConfigFormData {
  shares: TransactionShareInput[];
  notifyUsers: boolean;
}

export interface ShareSummary {
  total_shared_transactions: number;
  pending_shares: number;
  accepted_shares: number;
  declined_shares: number;
  total_amount_shared: number;
  total_amount_received: number;
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ShareCalculationResult {
  userId: string;
  shareType: "equal" | "percentage" | "fixed_amount";
  shareValue: number | null;
  calculatedAmount: number;
  userName: string;
}

export interface SharedTransactionNotification {
  id: string;
  transaction_id: string;
  from_user: {
    id: string;
    name: string;
    email: string;
  };
  transaction_description: string;
  transaction_amount: number;
  share_amount: number;
  share_type: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

// Enums para melhor type safety
export enum ShareType {
  EQUAL = "equal",
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
}

export enum ShareStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

// Tipos para APIs e serviços
export interface CreateSharedTransactionRequest {
  transaction: Omit<
    Transaction,
    "id" | "user_id" | "created_at" | "updated_at"
  >;
  shares: TransactionShareInput[];
}

export interface UpdateShareStatusRequest {
  shareId: string;
  status: ShareStatus;
}

export interface GetSharedTransactionsQuery {
  status?: ShareStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface SharedTransactionAnalytics {
  totalSharedAmount: number;
  totalPendingAmount: number;
  totalAcceptedAmount: number;
  mostSharedWithUser: {
    userId: string;
    userName: string;
    transactionCount: number;
    totalAmount: number;
  };
  sharingTrends: {
    month: string;
    sharedCount: number;
    totalAmount: number;
  }[];
}

// Tipos para validação de formulários
export interface ShareValidationError {
  field: string;
  message: string;
}

export interface ShareFormValidationResult {
  isValid: boolean;
  errors: ShareValidationError[];
  totalPercentage?: number;
  totalFixedAmount?: number;
}

// Tipos para componentes UI
export interface ShareComponentProps {
  transactionId: string;
  shares: TransactionShare[];
  onShareUpdate: (shares: TransactionShareInput[]) => void;
  isEditable?: boolean;
}

export interface UserSelectProps {
  onUserSelect: (user: UserSearchResult) => void;
  excludeUsers?: string[];
  placeholder?: string;
}

export interface ShareCalculatorProps {
  transactionAmount: number;
  shares: TransactionShareInput[];
  onChange: (shares: TransactionShareInput[]) => void;
}
