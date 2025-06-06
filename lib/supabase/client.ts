import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

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
