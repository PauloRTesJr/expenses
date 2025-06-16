import { render, screen } from "@testing-library/react";
import { SplitSummaryModal } from "../components/dashboard/split-summary-modal";
import { TransactionWithShares } from "../types/shared-transactions";

const baseTx = {
  category_id: "c1",
  date: "2024-06-10",
  is_installment: false,
  installment_count: null,
  installment_current: null,
  installment_group_id: null,
  created_at: "",
  updated_at: "",
};

function tx(owner: string, amount: number, type: "income" | "expense"): TransactionWithShares {
  return {
    ...baseTx,
    id: Math.random().toString(),
    description: "t",
    amount,
    type,
    user_id: owner,
    transaction_shares: [],
  } as TransactionWithShares;
}

describe("SplitSummaryModal", () => {
  it("renders totals", () => {
    const data = [tx("u1", 10, "income")];
    render(
      <SplitSummaryModal
        isOpen={true}
        onClose={() => {}}
        transactions={data}
        month={new Date("2024-06-05")}
        currentUserId="u1"
      />
    );
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText(/Income:/)).toBeInTheDocument();
  });
});
