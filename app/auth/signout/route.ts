import { createRouteHandlerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabase();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("signout error", error);
      return NextResponse.json(
        { error: "Erro ao fazer logout" },
        { status: 500 }
      );
    }

    // Redirecionar para a página de login após logout
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.log("signout catch", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
