import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

// Cliente para Server Components
export const createServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from Server Component - can be ignored
          }
        },
      },
    }
  );
};

// Cliente para API Routes
export const createRouteHandlerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from API route - can be ignored
          }
        },
      },
    }
  );
};

// Função para obter usuário autenticado no servidor
export const getServerUser = async () => {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log("getServerUser error", error);
      return null;
    }

    return user;
  } catch (error) {
    console.log("getServerUser catch", error);
    return null;
  }
};

// Função para verificar se usuário está autenticado no servidor
export const requireAuth = async () => {
  const user = await getServerUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  return user;
};
