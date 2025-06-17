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
    console.log('[DEBUG] createSharedTransaction called with:', { transactionData, shares, userId });
    try {
      // Criar a transação principal
      const installmentGroupId = transactionData.is_installment
        ? crypto.randomUUID()
        : null;
      const installmentCount = transactionData.is_installment && transactionData.installment_count ? transactionData.installment_count : 1;
      const installmentAmount = Number((transactionData.amount / installmentCount).toFixed(2));

      const createInstallmentTransaction = (installmentNumber: number) => {
        const installmentDate = new Date(transactionData.date);
        installmentDate.setMonth(installmentDate.getMonth() + (installmentNumber - 1));

        const description = installmentCount > 1 ? `${transactionData.description} (${installmentNumber}/${installmentCount})` : transactionData.description;

        return {
          description,
          amount: installmentAmount,
          type: transactionData.type,
          category_id: transactionData.category_id || null,
          date: installmentDate.toISOString().split("T")[0],
          user_id: userId,
          is_installment: true,
          installment_count: installmentCount,
          installment_current: installmentNumber,
          installment_group_id: installmentGroupId,
        };
      };

      const firstInstallmentTransaction = createInstallmentTransaction(1);

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(firstInstallmentTransaction)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Se houver compartilhamento, criar os registros de shares para a primeira parcela
      if (shares && shares.length > 0) {
  const shareInserts = shares.map((share) => ({
    transaction_id: transaction.id,
    shared_with_user_id: share.userId,
    share_type: share.shareType,
    share_value: share.shareValue !== undefined && share.shareValue !== null ? Number((share.shareValue / installmentCount).toFixed(2)) : null,
    status: "accepted" as const,
  }));
  console.log('[DEBUG] Inserting transaction_shares for first installment:', shareInserts);
  const { error: sharesError, data: sharesData } = await supabase
    .from("transaction_shares")
    .insert(shareInserts);
  console.log('[DEBUG] Insert result:', { sharesData, sharesError });
  if (sharesError) {
    await supabase.from("transactions").delete().eq("id", transaction.id);
    console.error('[DEBUG] Error inserting transaction_shares for first installment:', sharesError);
    throw sharesError;
  }
}

      // Se for parcelado, criar as demais parcelas
      if (installmentCount > 1) {
        const installments = Array(installmentCount - 1)
          .fill(null)
          .map((_, index) => createInstallmentTransaction(index + 2));

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
      share_value: share.shareValue !== undefined && share.shareValue !== null ? Number((share.shareValue / installmentCount).toFixed(2)) : null,
      status: "accepted" as const,
    }))
  );
  console.log('[DEBUG] Inserting transaction_shares for subsequent installments:', allInstallmentShares);
  const { error: installmentSharesError, data: installmentSharesData } = await supabase
    .from("transaction_shares")
    .insert(allInstallmentShares);
  console.log('[DEBUG] Insert result for subsequent installments:', { installmentSharesData, installmentSharesError });
  if (installmentSharesError) {
    console.error('[DEBUG] Error inserting transaction_shares for subsequent installments:', installmentSharesError);
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
