import * as Client from "../lib/supabase/client";

describe("createSharedTransaction - client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates shares for each installment", async () => {
    const transactionData = {
      description: "Test Income",
      amount: 100,
      type: "income" as const,
      category_id: undefined,
      date: new Date("2025-06-16"),
      is_installment: true,
      installment_count: 3,
    };

    const shares = [
      { userId: "user-1", shareType: "equal" as const, shareValue: undefined },
    ];

    const mockInsert = jest
      .fn()
      .mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "transaction-1", installment_group_id: "group-1" },
              error: null,
            }),
        }),
      })
      .mockReturnValueOnce(Promise.resolve({ error: null }))
      .mockReturnValueOnce({
        select: () =>
          Promise.resolve({
            data: [{ id: "inst-2" }, { id: "inst-3" }],
            error: null,
          }),
      })
      .mockReturnValueOnce(Promise.resolve({ error: null }));

    (Client.supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    (Client.supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "owner" } },
      error: null,
    });

    const result = await Client.createSharedTransaction(transactionData, shares);

    expect(result).toBeDefined();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsert.mock.calls[1][0]).toEqual([
      {
        transaction_id: "transaction-1",
        shared_with_user_id: "user-1",
        share_type: "equal",
        share_value: undefined,
        status: "accepted",
      },
    ]);
    expect(mockInsert.mock.calls[3][0]).toEqual([
      {
        transaction_id: "inst-2",
        shared_with_user_id: "user-1",
        share_type: "equal",
        share_value: undefined,
        status: "accepted",
      },
      {
        transaction_id: "inst-3",
        shared_with_user_id: "user-1",
        share_type: "equal",
        share_value: undefined,
        status: "accepted",
      },
    ]);
  });
});
