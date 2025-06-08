jest.mock("@supabase/ssr", () => {
  const supabase = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    })),
  };
  return {
    createBrowserClient: jest.fn(() => supabase),
    __supabase: supabase,
  };
});

import { searchUsers } from "../lib/supabase/client";
import { createBrowserClient } from "@supabase/ssr";

const supabaseMock = (createBrowserClient as jest.Mock).mock.results[0].value;

describe("searchUsers", () => {
  beforeEach(() => {
    supabaseMock.rpc.mockReset();
    supabaseMock.from.mockReset();
    supabaseMock.auth.getUser.mockReset();
  });

  it("queries profiles with provided query", async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) =>
        resolve({
          data: [
            { id: "1", full_name: "Test User", email: "test@example.com", avatar_url: null },
          ],
          error: null,
        })
      ),
    } as any;
    supabaseMock.from.mockReturnValue(builder);
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "current" } }, error: null });

    const results = await searchUsers("te");

    expect(supabaseMock.from).toHaveBeenCalledWith("profiles");
    expect(builder.or).toHaveBeenCalledWith("full_name.ilike.%te%,email.ilike.%te%");
    expect(builder.neq).toHaveBeenCalledWith("id", "current");
    expect(builder.limit).toHaveBeenCalledWith(20);
    expect(results).toEqual([
      { id: "1", full_name: "Test User", email: "test@example.com", avatar_url: null },
    ]);
  });

  it("returns empty array for short query", async () => {
    const results = await searchUsers("a");
    expect(results).toEqual([]);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("throws error when RPC fails", async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: null, error: new Error("fail") })),
    } as any;
    supabaseMock.from.mockReturnValue(builder);
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "current" } }, error: null });

    await expect(searchUsers("john")).rejects.toThrow("Erro ao buscar usuários");
  });
});
