import { POST } from "../app/auth/signout/route";
import { createRouteHandlerSupabase } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createRouteHandlerSupabase: jest.fn(),
}));

jest.mock("next/server", () => {
  const mockResponse = (body: any, init: any = {}) => ({
    status: init.status || 200,
    headers: new Map(Object.entries(init.headers || {})),
    json: async () => body,
  });
  return {
    NextResponse: {
      redirect: (url: URL) =>
        mockResponse(null, { status: 307, headers: { location: url.pathname } }),
      json: (data: any, init?: any) => mockResponse(data, init),
    },
    NextRequest: class {},
  };
});

describe("signout route", () => {
  const mockSupabase = { auth: { signOut: jest.fn() } } as any;
  const request: any = { url: "http://localhost/api/signout" };

  beforeEach(() => {
    mockSupabase.auth.signOut.mockReset();
    (createRouteHandlerSupabase as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it("redirects on successful signout", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const res = await POST(request);
    expect(res.headers.get("location")).toBe("/login");
  });

  it("returns 500 when signout returns error", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: new Error("fail") });

    const res = await POST(request);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Erro ao fazer logout");
  });

  it("handles exceptions", async () => {
    mockSupabase.auth.signOut.mockRejectedValue(new Error("oops"));

    const res = await POST(request);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Erro interno do servidor");
  });
});
