import { calculateMonthlySharedSummary } from "../lib/transactions/shared-summary";
import { TransactionWithShares } from "../types/shared-transactions";

const createShare = (userId: string) => ({
  id: "s" + userId,
  transaction_id: "t",
  shared_with_user_id: userId,
  share_type: "equal" as const,
  share_value: null,
  status: "accepted" as const,
  created_at: "2024-06-01",
  updated_at: "2024-06-01",
  profiles: { full_name: userId, email: `${userId}@x.com` },
});

describe("calculateMonthlySharedSummary", () => {
  it("computes balances correctly", () => {
    const transactions: (TransactionWithShares & { owner_profile?: { full_name?: string | null; email?: string | null } })[] = [
      {
        id: "t1",
        description: "A",
        amount: 100,
        type: "expense",
        category_id: "c",
        date: "2024-06-05",
        user_id: "u1",
        created_at: "",
        updated_at: "",
        is_installment: false,
        installment_count: null,
        installment_current: null,
        installment_group_id: null,
        transaction_shares: [createShare("u2")],
        owner_profile: { full_name: "User1", email: "u1@x.com" },
      },
      {
        id: "t2",
        description: "B",
        amount: 50,
        type: "expense",
        category_id: "c",
        date: "2024-06-06",
        user_id: "u2",
        created_at: "",
        updated_at: "",
        is_installment: false,
        installment_count: null,
        installment_current: null,
        installment_group_id: null,
        transaction_shares: [createShare("u1")],
        owner_profile: { full_name: "User2", email: "u2@x.com" },
      },
      {
        id: "t3",
        description: "C",
        amount: 80,
        type: "income",
        category_id: "c",
        date: "2024-06-07",
        user_id: "u2",
        created_at: "",
        updated_at: "",
        is_installment: false,
        installment_count: null,
        installment_current: null,
        installment_group_id: null,
        transaction_shares: [createShare("u1")],
        owner_profile: { full_name: "User2", email: "u2@x.com" },
      },
    ];

    const res = calculateMonthlySharedSummary(transactions, "u1", new Date("2024-06-01"));
    expect(res).toHaveLength(1);
    const summary = res[0];
    expect(summary.userId).toBe("u2");
    expect(summary.userName).toBe("u2");
    expect(summary.totalExpense).toBe(75);
    expect(summary.totalIncome).toBe(40);
    expect(summary.balance).toBe(65);
  });
});
