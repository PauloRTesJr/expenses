jest.mock("@supabase/ssr", () => {
  const supabase = {
    from: jest.fn(),
  };
  return {
    createBrowserClient: jest.fn(() => supabase),
    __supabase: supabase,
  };
});

import { fetchTransactionsWithShares } from "../lib/supabase/client";
import { createBrowserClient } from "@supabase/ssr";

const supabaseMock = (createBrowserClient as jest.Mock).mock.results[0].value;

const ownTransaction = {
  id: "t1",
  description: "Own",
  amount: 10,
  type: "income" as const,
  category_id: "c1",
  date: "2024-06-01",
  owner: { full_name: "Owner1", email: "o1@example.com" },
};

const sharedTransaction = {
  id: "t2",
  description: "Shared",
  amount: 20,
  type: "expense" as const,
  category_id: "c2",
  date: "2024-06-02",
  owner: { full_name: "Owner2", email: "o2@example.com" },
};

const shareRecords = [
  { id: "s1", transaction_id: "t1", shared_with_user_id: "u2" },
  { id: "s2", transaction_id: "t2", shared_with_user_id: "u1" },
];

const profileData = [{ id: "u1", full_name: "User", email: "u@example.com" }];

function setupMocks() {
  const transactionsChain: any = {
    select: jest.fn(() => transactionsChain),
    eq: jest.fn(() => transactionsChain),
    order: jest.fn(() => Promise.resolve({ data: [ownTransaction], error: null })),
  };

  const sharedIdsChain: any = {} as any;
  sharedIdsChain.select = jest.fn(() => sharedIdsChain);
  sharedIdsChain.eq = jest
    .fn()
    .mockReturnValueOnce(sharedIdsChain)
    .mockResolvedValueOnce({ data: [{ transaction_id: "t2" }], error: null });

  const sharedTransChain: any = {
    select: jest.fn(() => sharedTransChain),
    in: jest.fn(() => Promise.resolve({ data: [sharedTransaction], error: null })),
  };

  const sharesChain: any = {
    select: jest.fn(() => sharesChain),
    in: jest.fn(() => Promise.resolve({ data: shareRecords, error: null })),
  };

  const profilesChain: any = {
    select: jest.fn(() => profilesChain),
    in: jest.fn(() => Promise.resolve({ data: profileData, error: null })),
  };

  supabaseMock.from.mockReset();
  supabaseMock.from
    .mockImplementationOnce(() => transactionsChain)
    .mockImplementationOnce(() => sharedIdsChain)
    .mockImplementationOnce(() => sharedTransChain)
    .mockImplementationOnce(() => sharesChain)
    .mockImplementationOnce(() => profilesChain);
}

function setupMocksNoOwn() {
  const transactionsChain: any = {
    select: jest.fn(() => transactionsChain),
    eq: jest.fn(() => transactionsChain),
    order: jest.fn(() => Promise.resolve({ data: [], error: null })),
  };

  const sharedIdsChain: any = {} as any;
  sharedIdsChain.select = jest.fn(() => sharedIdsChain);
  sharedIdsChain.eq = jest
    .fn()
    .mockReturnValueOnce(sharedIdsChain)
    .mockResolvedValueOnce({ data: [{ transaction_id: "t2" }], error: null });

  const sharedTransChain: any = {
    select: jest.fn(() => sharedTransChain),
    in: jest.fn(() => Promise.resolve({ data: [sharedTransaction], error: null })),
  };

  const sharesChain: any = {
    select: jest.fn(() => sharesChain),
    in: jest.fn(() => Promise.resolve({ data: shareRecords, error: null })),
  };

  const profilesChain: any = {
    select: jest.fn(() => profilesChain),
    in: jest.fn(() => Promise.resolve({ data: profileData, error: null })),
  };

  supabaseMock.from.mockReset();
  supabaseMock.from
    .mockImplementationOnce(() => transactionsChain)
    .mockImplementationOnce(() => sharedIdsChain)
    .mockImplementationOnce(() => sharedTransChain)
    .mockImplementationOnce(() => sharesChain)
    .mockImplementationOnce(() => profilesChain);
}

describe("fetchTransactionsWithShares", () => {
  it("returns owned and shared transactions", async () => {
    setupMocks();
    const data = await fetchTransactionsWithShares("u1");
    expect(data).toHaveLength(2);
  });

  it("returns shared transactions when user has none", async () => {
    setupMocksNoOwn();
    const data = await fetchTransactionsWithShares("u1");
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("t2");
  });

  it("throws on query error", async () => {
    const errorChain: any = {
      select: jest.fn(() => errorChain),
      eq: jest.fn(() => errorChain),
      order: jest.fn(() => Promise.resolve({ data: null, error: new Error("fail") })),
    };
    supabaseMock.from.mockReset();
    supabaseMock.from.mockReturnValue(errorChain);

    await expect(fetchTransactionsWithShares("u1")).rejects.toThrow(
      "Erro ao buscar transações com compartilhamentos"
    );
  });
});
