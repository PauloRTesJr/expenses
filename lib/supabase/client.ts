import { createBrowserClient } from "@supabase/ssr";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  Database,
  TransactionFormData,
  TransactionShareInput,
  ProfileWithAvatar,
} from "@/types/database";

export const createClientSupabase = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const supabase = createClientSupabase();

// Função para verificar se o usuário está autenticado
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log("getCurrentUser error", error);
      return null;
    }

    return user;
  } catch (error) {
    console.log("getCurrentUser catch", error);
    return null;
  }
};

// Função para fazer logout
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("signOut error", error);
      throw error;
    }
  } catch (error) {
    console.log("signOut catch", error);
    throw new Error("Erro ao fazer logout");
  }
};

// Função para buscar usuários para compartilhamento
export const searchUsers = async (query: string) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    // Utiliza a stored procedure para respeitar as regras de privacidade
    const { data, error } = await supabase.rpc("search_users_for_sharing", {
      search_query: query,
      current_user_id: currentUser.id,
    });

    if (error) {
      console.log("searchUsers error", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.log("searchUsers catch", error);
    throw new Error("Erro ao buscar usuários");
  }
};

// Função para criar transação compartilhada
export const createSharedTransaction = async (
  transactionData: TransactionFormData,
  shares: TransactionShareInput[]
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Criar a transação principal
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category_id: transactionData.category_id || null,
        date: transactionData.date.toISOString().split("T")[0],
        user_id: user.id,
        is_installment: transactionData.is_installment,
        installment_count: transactionData.installment_count,
        installment_current: transactionData.is_installment ? 1 : null,
        installment_group_id: transactionData.is_installment
          ? crypto.randomUUID()
          : null,
      })
      .select()
      .single();

    if (transactionError) {
      console.log("createSharedTransaction transactionError", transactionError);
      throw transactionError;
    }

    // Se houver compartilhamento, criar os registros de shares
    if (shares && shares.length > 0) {
      const shareInserts = shares.map((share) => ({
        transaction_id: transaction.id,
        shared_with_user_id: share.userId,
        share_type: share.shareType,
        share_value: share.shareValue,
        status: "pending" as const,
      }));

      const { error: sharesError } = await supabase
        .from("transaction_shares")
        .insert(shareInserts);

      if (sharesError) {
        console.log("createSharedTransaction sharesError", sharesError);
        // Se houver erro ao criar os shares, deletar a transação
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
          user_id: user.id,
          is_installment: true,
          installment_count: transactionData.installment_count,
          installment_current: i,
          installment_group_id: installmentGroupId,
        });
      }

      const { data: installmentTransactions, error: installmentsError } =
        await supabase.from("transactions").insert(installments).select();

      if (installmentsError) {
        console.log(
          "createSharedTransaction installmentsError",
          installmentsError
        );
        throw installmentsError;
      }

      // Se houver compartilhamento, criar shares para cada parcela
      if (shares && shares.length > 0 && installmentTransactions) {
        const allInstallmentShares = installmentTransactions.flatMap((inst) =>
          shares.map((share) => ({
            transaction_id: inst.id,
            shared_with_user_id: share.userId,
            share_type: share.shareType,
            share_value: share.shareValue,
            status: "pending" as const,
          }))
        );

        const { error: installmentSharesError } = await supabase
          .from("transaction_shares")
          .insert(allInstallmentShares);

        if (installmentSharesError) {
          console.log(
            "createSharedTransaction installmentSharesError",
            installmentSharesError
          );
          throw installmentSharesError;
        }
      }
    }

    return transaction;
  } catch (error) {
    console.log("createSharedTransaction catch", error);
    throw new Error("Erro ao criar transação compartilhada");
  }
};

/**
 * Obtém o usuário atual com dados do perfil carregados automaticamente
 */
export const getCurrentUserWithProfile = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, profile: null, error: userError };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Buscar URL do avatar se existir
    let avatarUrl = null;
    try {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (files && files.length > 0) {
        const latestFile = files.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("avatars")
          .getPublicUrl(`${user.id}/${latestFile.name}`);

        avatarUrl = publicUrl;
      }
    } catch (storageError) {
      console.log("Error loading avatar:", storageError);
    }

    const profileWithAvatar = profile
      ? {
          ...profile,
          avatar_url: avatarUrl,
        }
      : null;

    return {
      user,
      profile: profileWithAvatar,
      error: profileError,
    };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

/**
 * Hook para verificar se o usuário está autenticado com perfil
 */
export const useAuthWithProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileWithAvatar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    getCurrentUserWithProfile().then(({ user, profile }) => {
      setUser(user);
      setProfile(profile);
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { profile } = await getCurrentUserWithProfile();
        setUser(session.user);
        setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
};
