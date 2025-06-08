import { supabase } from "@/lib/supabase/client";
import type {
  Profile,
  ProfileFormData,
  UserSearchResult,
  AvatarUploadResult,
  ProfileStats,
  ProfileWithAvatar,
} from "@/types/database";

export class ProfileService {
  /**
   * Busca o perfil do usuário atual
   */
  static async getCurrentProfile(): Promise<ProfileWithAvatar | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  }

  /**
   * Busca um perfil específico por ID
   */
  static async getProfile(userId: string): Promise<ProfileWithAvatar | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  }

  /**
   * Atualiza os dados do perfil do usuário
   */
  static async updateProfile(
    userId: string,
    data: ProfileFormData
  ): Promise<Profile> {
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw new Error("Erro ao atualizar perfil");
    }

    return updatedProfile;
  }

  /**
   * Completa o onboarding do usuário
   */
  static async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (error) {
      console.error("Error completing onboarding:", error);
      throw new Error("Erro ao completar onboarding");
    }
  }

  /**
   * Busca usuários para compartilhamento
   */
  static async searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const currentUser = await supabase.auth.getUser();

    let builder = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("full_name")
      .limit(20);

    if (currentUser.data.user) {
      builder = builder.neq("id", currentUser.data.user.id);
    }

    const { data, error } = await builder;

    if (error) {
      console.error("Error searching users:", error);
      throw new Error("Erro ao buscar usuários");
    }

    return data || [];
  }

  /**
   * Upload de avatar do usuário
   */
  static async uploadAvatar(
    userId: string,
    file: File
  ): Promise<AvatarUploadResult> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      throw new Error("Erro ao fazer upload do avatar");
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Atualiza o perfil com a nova URL do avatar
    await this.updateProfile(userId, { avatar_url: urlData.publicUrl });

    return {
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
    };
  }

  /**
   * Remove o avatar do usuário
   */
  static async removeAvatar(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);

    if (profile?.avatar_url) {
      // Extract path from URL
      const urlParts = profile.avatar_url.split("/");
      const path = urlParts.slice(-2).join("/"); // Gets 'avatars/filename'

      // Remove from storage
      await supabase.storage.from("avatars").remove([path]);
    }

    // Update profile to remove avatar URL
    await this.updateProfile(userId, { avatar_url: null });
  }

  /**
   * Obtém estatísticas do perfil do usuário
   */
  static async getProfileStats(userId: string): Promise<ProfileStats> {
    const [transactionsResult, sharesResult, profileResult] = await Promise.all(
      [
        supabase
          .from("transactions")
          .select("type, amount")
          .eq("user_id", userId),
        supabase
          .from("transaction_shares")
          .select("status")
          .eq("shared_with_user_id", userId),
        supabase
          .from("profiles")
          .select("created_at")
          .eq("id", userId)
          .single(),
      ]
    );

    const transactions = transactionsResult.data || [];
    const shares = sharesResult.data || [];

    const totalTransactions = transactions.length;
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSharedTransactions = shares.length;
    const acceptedShares = shares.filter((s) => s.status === "accepted").length;

    return {
      totalTransactions,
      totalExpenses,
      totalIncome,
      totalSharedTransactions,
      acceptedShares,
      joinedDate: profileResult.data?.created_at || null,
    };
  }

  /**
   * Cria ou atualiza o perfil inicial do usuário
   */
  static async createOrUpdateProfile(
    userId: string,
    email: string,
    initialData?: Partial<ProfileFormData>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email,
        ...initialData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating/updating profile:", error);
      throw new Error("Erro ao criar/atualizar perfil");
    }

    return data;
  }
}
