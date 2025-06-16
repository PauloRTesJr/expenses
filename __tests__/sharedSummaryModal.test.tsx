import { render, screen } from "@testing-library/react";
import { SharedSummaryModal } from "../components/dashboard/shared-summary-modal";
import { TransactionWithCategoryAndShares } from "../types/shared-transactions";

const createShare = (userId: string) => ({
  id: "s" + userId,
  transaction_id: "t",
  shared_with_user_id: userId,
  share_type: "equal" as const,
  share_value: null,
  status: "accepted" as const,
  created_at: "",
  updated_at: "",
  profiles: { full_name: "User" + userId, email: userId + "@x.com" },
});

describe("SharedSummaryModal", () => {
  it("displays summary cards and table", () => {
    const transactions: TransactionWithCategoryAndShares[] = [
      {
        id: "t1",
        description: "A",
        amount: 10,
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
        category: null,
        owner_profile: { full_name: "User1", email: "u1@x.com" },
        transaction_shares: [createShare("u2")],
      },
      {
        id: "t2",
        description: "B",
        amount: 20,
        type: "income",
        category_id: "c",
        date: "2024-06-06",
        user_id: "u2",
        created_at: "",
        updated_at: "",
        is_installment: false,
        installment_count: null,
        installment_current: null,
        installment_group_id: null,
        category: null,
        owner_profile: { full_name: "User2", email: "u2@x.com" },
        transaction_shares: [createShare("u1")],
      },
    ];

    render(
      <SharedSummaryModal
        isOpen={true}
        onClose={() => {}}
        transactions={transactions}
        currentUserId="u1"
        month={new Date("2024-06-01")}
      />
    );

    expect(screen.getByText("User2")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
