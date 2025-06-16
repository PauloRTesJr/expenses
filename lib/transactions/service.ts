import { supabase, fetchTransactionsWithShares } from "@/lib/supabase/client";
import type { TransactionFormData, TransactionShareInput } from "@/types/database";
import { handleError } from "@/lib/errors";

export class TransactionsService {
  static async fetchTransactionsWithShares(userId: string) {
    try {
      return await fetchTransactionsWithShares(userId);
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

