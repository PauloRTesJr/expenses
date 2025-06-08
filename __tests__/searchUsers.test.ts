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
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
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
  });

  it("calls Supabase RPC with provided query", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [
        { id: "1", full_name: "Test User", email: "test@example.com", avatar_url: null },
      ],
      error: null,
    });

    const results = await searchUsers("te");

    expect(supabaseMock.rpc).toHaveBeenCalledWith("search_users_for_sharing", {
      search_query: "te",
    });
    expect(results).toEqual([
      { id: "1", full_name: "Test User", email: "test@example.com", avatar_url: null },
    ]);
  });

  it("returns empty array for short query", async () => {
    const results = await searchUsers("a");
    expect(results).toEqual([]);
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it("throws error when RPC fails", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: new Error("fail") });

    await expect(searchUsers("john")).rejects.toThrow("Erro ao buscar usuários");
  });
});
