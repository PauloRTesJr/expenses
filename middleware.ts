import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get authenticated user - more secure than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas protegidas que requerem autenticação
  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/categories",
    "/budgets",
    "/reports",
  ];

  // Rotas de autenticação que redirecionam se o usuário já estiver logado
  const authRoutes = ["/login", "/register"];

  const { pathname } = request.nextUrl;

  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se a rota atual é de autenticação
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  try {
    // Se não há usuário autenticado e está tentando acessar rota protegida
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se há usuário autenticado e está tentando acessar rota de auth
    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    console.log("middleware error", error);

    // Em caso de erro, redirecionar para login se for rota protegida
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|api|public).*)",
  ],
};
