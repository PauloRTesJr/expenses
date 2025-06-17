import { createBrowserClient } from "@supabase/ssr";
import { useState, useEffect } from "react";
import { env } from "@/config";
import { User } from "@supabase/supabase-js";
import {
  Database,
  TransactionFormData,
  TransactionShareInput,
  ProfileWithAvatar,
  TransactionWithCategory,
} from "@/types/database";

export const createClientSupabase = () => {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
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

    let builder = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("full_name")
      .limit(20);

    if (currentUser) {
      builder = builder.neq("id", currentUser.id);
    }

    const { data, error } = await builder;

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
    const installmentGroupId =
      transactionData.is_installment ? crypto.randomUUID() : null;

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
        installment_group_id: installmentGroupId,
      })
      .select()
      .single();

    if (transactionError) {
      console.log("createSharedTransaction transactionError", transactionError);
      throw transactionError;
    } // Se houver compartilhamento, criar os registros de shares
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
      } // Se houver compartilhamento, criar shares para cada parcela
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

/**
 * Buscar transações com informações de compartilhamento
 */
import { TransactionWithCategoryAndShares } from "@/types/shared-transactions";

export const fetchTransactionsWithShares = async (
  userId: string,
): Promise<TransactionWithCategoryAndShares[]> => {
  try {
    console.log(
      "fetchTransactionsWithShares: Fetching transactions for user:",
      userId
    );

    const { data: transactionsData, error } = await supabase
      .from("transactions")
      .select(`*, category:categories(*)`)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;

    console.log(
      "fetchTransactionsWithShares: Found transactions:",
      transactionsData?.length
    );

    // Fetch transactions shared with the user
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

  // Merge owned and shared transactions
    const allTransactions = [...(transactionsData || []), ...sharedTransactions];

  // Fetch owner profiles
    const ownerIds = Array.from(new Set(allTransactions.map((t) => t.user_id)));
    let ownerProfiles: { id: string; full_name: string | null; email: string }[] = [];

    if (ownerIds.length > 0) {
      const { data: profiles, error: ownerError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);

      if (ownerError) throw ownerError;
      ownerProfiles = profiles || [];
    }

  // Fetch transaction shares separately to avoid complex join issues
    const transactionIds = allTransactions.map((t) => t.id);

  interface ShareWithProfile {
      id: string;
      transaction_id: string;
      shared_with_user_id: string;
      share_type: "equal" | "percentage" | "fixed_amount";
      share_value: number | null;
      status: "pending" | "accepted" | "declined";
      created_at: string;
      updated_at: string;
      profiles: {
        full_name: string | null;
        email: string;
      };
    }

    let sharesData: ShareWithProfile[] = [];
    if (transactionIds.length > 0) {
      console.log(
        "fetchTransactionsWithShares: Fetching shares for transaction IDs:",
        transactionIds
      );

      const { data: shares, error: sharesError } = await supabase
        .from("transaction_shares")
        .select(
          `
          id,
          transaction_id,
          shared_with_user_id,
          share_type,
          share_value,
          status,
          created_at,
          updated_at
        `
        )
        .in("transaction_id", transactionIds);

      if (sharesError) throw sharesError;

      console.log("fetchTransactionsWithShares: Found shares:", shares?.length);

      // Get profiles for shared users
      const sharedUserIds = shares?.map((s) => s.shared_with_user_id) || [];

      interface ProfileData {
        id: string;
        full_name: string | null;
        email: string;
      }

      let profilesData: ProfileData[] = [];

      if (sharedUserIds.length > 0) {
        console.log(
          "fetchTransactionsWithShares: Fetching profiles for user IDs:",
          sharedUserIds
        );

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", sharedUserIds);

        if (profilesError) throw profilesError;
        profilesData = profiles || [];
        console.log(
          "fetchTransactionsWithShares: Found profiles:",
          profilesData.length
        );
      }

      // Combine shares with profile data
      sharesData = (shares || []).map((share) => ({
        ...share,
        share_type: share.share_type as "equal" | "percentage" | "fixed_amount",
        status: share.status as "pending" | "accepted" | "declined",
        profiles:
          profilesData.find((p) => p.id === share.shared_with_user_id) || {
            full_name: null,
            email: "",
          },
      }));

      console.log(
        "fetchTransactionsWithShares: Combined shares with profiles:",
        sharesData
      );
    }

    // Combine transactions with their shares and owner profile
    const transformedData = allTransactions.map((transaction) => {
      const transactionShares = sharesData.filter(
        (share) => share.transaction_id === transaction.id
      );
      const ownerProfile =
        ownerProfiles.find((p) => p.id === transaction.user_id) || null;
      console.log(
        `Transaction ${transaction.id} has ${transactionShares.length} shares:`,
        transactionShares
      );

      return {
        ...transaction,
        transaction_shares: transactionShares,
        owner_profile: ownerProfile,
      };
    });

    const sortedData = transformedData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(
      "fetchTransactionsWithShares: Final transformed data:",
      sortedData
    );
    return sortedData;
  } catch (error) {
    console.log("fetchTransactionsWithShares error", error);
    throw new Error("Erro ao buscar transações com compartilhamentos");
  }
};
