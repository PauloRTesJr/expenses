import { calculateMonthlySplits } from "../lib/shared-calculations";
import { TransactionWithShares } from "../types/shared-transactions";

describe("calculateMonthlySplits", () => {
  const month = new Date("2024-06-05");

  const tx = (
    id: string,
    owner: string,
    amount: number,
    type: "income" | "expense",
    shares: any[] = []
  ): TransactionWithShares => ({
    id,
    description: id,
    amount,
    type,
    category_id: "c1",
    date: "2024-06-10",
    user_id: owner,
    is_installment: false,
    installment_count: null,
    installment_current: null,
    installment_group_id: null,
    created_at: "",
    updated_at: "",
    transaction_shares: shares,
  });

  const share = (uid: string) => ({
    id: `s-${uid}`,
    transaction_id: "t",
    shared_with_user_id: uid,
    share_type: "equal" as const,
    share_value: null,
    status: "accepted" as const,
    created_at: "",
    updated_at: "",
    profiles: { full_name: uid, email: `${uid}@x.com` },
  });

  it("computes totals and settlements", () => {
    const data = [
      tx("t1", "u1", 100, "expense", [share("u2")]),
      tx("t2", "u2", 60, "expense", [share("u1")]),
      tx("t3", "u1", 100, "income", [share("u2")]),
    ];
    const result = calculateMonthlySplits(data, month);
    expect(result.userTotals["u1"].expense).toBe(80);
    expect(result.userTotals["u2"].expense).toBe(80);
    expect(result.settlements).toEqual([
      { from: "u1", to: "u2", amount: 30 },
    ]);
  });
});
