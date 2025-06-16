import { supabase } from "@/lib/supabase/client";
import type {
  TransactionFormData,
  TransactionShareInput,
  TransactionWithCategory,
} from "@/types/database";
import { handleError } from "@/lib/errors";

export class TransactionsService {
  static async fetchTransactionsWithShares(userId: string) {
    try {
      const { data: transactionsData, error } = await supabase
        .from("transactions")
        .select(`*, category:categories(*)`)
        .eq("user_id", userId)
        .order("date", { ascending: false });
      if (error) throw error;

      const { data: sharedIds, error: sharedIdsError } = await supabase
        .from("transaction_shares")
        .select("transaction_id")
        .eq("shared_with_user_id", userId)
        .eq("status", "accepted");
      if (sharedIdsError) throw sharedIdsError;

      const sharedTransactionIds = sharedIds?.map((s) => s.transaction_id) || [];
      let sharedTransactions: TransactionWithCategory[] = [];

      if (sharedTransactionIds.length > 0) {
        const { data: sharedData, error: sharedError } = await supabase
          .from("transactions")
          .select(`*, category:categories(*)`)
          .in("id", sharedTransactionIds);
        if (sharedError) throw sharedError;
        sharedTransactions = sharedData || [];
      }

      const allTransactions = [...(transactionsData || []), ...sharedTransactions];
      return allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      handleError("fetchTransactionsWithShares", error);
      throw new Error("Erro ao buscar transações com compartilhamentos");
    }
  }

  static async createSharedTransaction(
    transactionData: TransactionFormData,
    shares: TransactionShareInput[],
    userId: string
  ) {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          category_id: transactionData.category_id || null,
          date: transactionData.date.toISOString().split("T")[0],
          user_id: userId,
          is_installment: transactionData.is_installment,
          installment_count: transactionData.installment_count,
          installment_current: transactionData.is_installment ? 1 : null,
          installment_group_id: transactionData.is_installment
            ? crypto.randomUUID()
            : null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      if (shares && shares.length > 0) {
        const shareInserts = shares.map((share) => ({
          transaction_id: transaction.id,
          shared_with_user_id: share.userId,
          share_type: share.shareType,
          share_value: share.shareValue,
          status: "accepted" as const,
        }));
        const { error: sharesError } = await supabase
          .from("transaction_shares")
          .insert(shareInserts);
        if (sharesError) {
          await supabase.from("transactions").delete().eq("id", transaction.id);
          throw sharesError;
        }
      }

      return transaction;
    } catch (error) {
      handleError("createSharedTransaction", error);
      throw new Error("Erro ao criar transação compartilhada");
    }
  }
}

