import { supabase, fetchTransactionsWithShares } from "@/lib/supabase/client";
import type {
  TransactionFormData,
  TransactionShareInput,
} from "@/types/database";
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
      // Criar a transação principal
      const installmentGroupId = transactionData.is_installment
        ? crypto.randomUUID()
        : null;
      const firstInstallmentDescription =
        transactionData.is_installment && transactionData.installment_count
          ? `${transactionData.description} (1/${transactionData.installment_count})`
          : transactionData.description;

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          description: firstInstallmentDescription,
          amount: transactionData.amount,
          type: transactionData.type,
          category_id: transactionData.category_id || null,
          date: transactionData.date.toISOString().split("T")[0],
          user_id: userId,
          is_installment: transactionData.is_installment,
          installment_count: transactionData.installment_count,
          installment_current: transactionData.is_installment ? 1 : null,
          installment_group_id: installmentGroupId,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Se houver compartilhamento, criar os registros de shares para a primeira parcela
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

      // Se for parcelado, criar as demais parcelas
      if (
        transactionData.is_installment &&
        transactionData.installment_count &&
        transactionData.installment_count > 1
      ) {
        const installments = [];
        const installmentGroupId = transaction.installment_group_id;

        for (let i = 2; i <= transactionData.installment_count; i++) {
          const installmentDate = new Date(transactionData.date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

          installments.push({
            description: `${transactionData.description} (${i}/${transactionData.installment_count})`,
            amount: transactionData.amount,
            type: transactionData.type,
            category_id: transactionData.category_id || null,
            date: installmentDate.toISOString().split("T")[0],
            user_id: userId,
            is_installment: true,
            installment_count: transactionData.installment_count,
            installment_current: i,
            installment_group_id: installmentGroupId,
          });
        }

        const { data: installmentTransactions, error: installmentsError } =
          await supabase.from("transactions").insert(installments).select();

        if (installmentsError) {
          throw installmentsError;
        }

        // Se houver compartilhamento, criar shares para cada parcela adicional
        if (shares && shares.length > 0 && installmentTransactions) {
          const allInstallmentShares = installmentTransactions.flatMap((inst) =>
            shares.map((share) => ({
              transaction_id: inst.id,
              shared_with_user_id: share.userId,
              share_type: share.shareType,
              share_value: share.shareValue,
              status: "accepted" as const,
            }))
          );

          const { error: installmentSharesError } = await supabase
            .from("transaction_shares")
            .insert(allInstallmentShares);

          if (installmentSharesError) {
            throw installmentSharesError;
          }
        }
      }

      return transaction;
    } catch (error) {
      handleError("createSharedTransaction", error);
      throw new Error("Erro ao criar transação compartilhada");
    }
  }
}
