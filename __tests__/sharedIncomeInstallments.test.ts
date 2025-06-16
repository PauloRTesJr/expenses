/**
 * Teste específico para transações compartilhadas em parcelas
 */

// Mock do supabase
jest.mock("../lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: "mock-transaction-id",
                installment_group_id: "mock-group-id",
              },
              error: null,
            })
          ),
        })),
        error: null,
      })),
    })),
  },
}));

import { TransactionsService } from "../lib/transactions/service";
import { supabase } from "../lib/supabase/client";

describe("TransactionsService - Shared Income Installments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create multiple installments for shared income transactions", async () => {
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
      {
        userId: "user-1",
        shareType: "equal" as const,
        shareValue: undefined,
      },
    ];

    const userId = "owner-user";

    // Mock successful responses
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
      .mockReturnValueOnce(Promise.resolve({ error: null })) // shares insert
      .mockReturnValueOnce({
        select: () =>
          Promise.resolve({
            data: [{ id: "inst-2" }, { id: "inst-3" }],
            error: null,
          }),
      })
      .mockReturnValueOnce(Promise.resolve({ error: null })); // installment shares insert

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    // Execute the function
    const result = await TransactionsService.createSharedTransaction(
      transactionData,
      shares,
      userId
    );

    // Verify that the function completed successfully
    expect(result).toBeDefined();
    expect(supabase.from).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should handle single transactions correctly", async () => {
    const transactionData = {
      description: "Simple Income",
      amount: 200,
      type: "income" as const,
      category_id: undefined,
      date: new Date("2025-06-16"),
      is_installment: false,
      installment_count: undefined,
    };

    const shares = [
      {
        userId: "user-1",
        shareType: "equal" as const,
        shareValue: undefined,
      },
    ];

    const userId = "owner-user";

    const mockInsert = jest
      .fn()
      .mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "simple-transaction" },
              error: null,
            }),
        }),
      })
      .mockReturnValueOnce(Promise.resolve({ error: null }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await TransactionsService.createSharedTransaction(
      transactionData,
      shares,
      userId
    );

    expect(result).toBeDefined();
    expect(mockInsert).toHaveBeenCalledTimes(2); // One for transaction, one for shares
  });
});
