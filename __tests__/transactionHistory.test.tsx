import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionHistory } from "../components/dashboard/transaction-history";
import { TransactionWithCategoryAndShares } from "../types/shared-transactions";

const baseTx = {
  amount: 10,
  category_id: "c1",
  date: "2024-06-10",
  type: "income" as const,
  user_id: "u1",
  is_installment: false,
  installment_count: null,
  installment_current: null,
  installment_group_id: null,
  updated_at: "2024-06-10",
};

const shared = (name: string) => ({
  id: `s-${name}`,
  transaction_id: "t",
  shared_with_user_id: `u-${name}`,
  share_type: "equal" as const,
  share_value: null,
  status: "accepted" as const,
  created_at: "2024-06-10",
  updated_at: "2024-06-10",
  profiles: { full_name: name, email: `${name}@x.com` },
});

function tx(
  id: string,
  desc: string,
  created: string,
  shares: any[] = [],
  installmentData?: {
    is_installment: boolean;
    installment_current?: number;
    installment_count?: number;
  }
): TransactionWithCategoryAndShares {
  return {
    ...baseTx,
    id,
    description: desc,
    created_at: created,
    transaction_shares: shares,
    category: null,
    owner_profile: null,
    is_installment: installmentData?.is_installment || false,
    installment_current: installmentData?.installment_current || null,
    installment_count: installmentData?.installment_count || null,
  } as TransactionWithCategoryAndShares;
}

describe("TransactionHistory filters and sorting", () => {
  it("filters shared transactions", async () => {
    const data = [
      tx("1", "A", "2024-06-11"),
      tx("2", "B", "2024-06-10", [shared("Alice")]),
    ];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory
        transactions={data}
        isLoading={false}
        currentUserId="current-user-id"
      />
    );
    expect(container.querySelectorAll(".group")).toHaveLength(2);
    await user.click(screen.getByLabelText("Toggle shared filter"));
    await waitFor(() =>
      expect(container.querySelectorAll(".group")).toHaveLength(1)
    );
    expect(screen.queryByText("A")).toBeNull();
  });
  it("sorts by shared user", async () => {
    const data = [
      tx("1", "First", "2024-06-10", [shared("Charlie")]),
      tx("2", "Second", "2024-06-09", [shared("Alice")]),
    ];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory
        transactions={data}
        isLoading={false}
        currentUserId="current-user-id"
      />
    ); // initial sort by date
    const items = Array.from(container.querySelectorAll(".group"));
    expect(items[0].textContent).toContain("First");
    await user.click(screen.getByLabelText("Toggle sort mode"));
    await waitFor(() => {
      const sorted = Array.from(container.querySelectorAll(".group"));
      expect(sorted[0].textContent).toContain("Second");
    });
  });

  it("handles sorting when shares are missing", async () => {
    const data = [
      tx("1", "NoShare1", "2024-06-10"),
      tx("2", "NoShare2", "2024-06-09"),
    ];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory
        transactions={data}
        isLoading={false}
        currentUserId="current-user-id"
      />
    );
    await user.click(screen.getByLabelText("Toggle sort mode"));
    await waitFor(() => {
      expect(container.querySelectorAll(".group")).toHaveLength(2);
    });
  });
  it("displays installment information correctly", () => {
    const data = [
      tx("1", "Regular Transaction", "2024-06-10"),
      tx("2", "Installment Transaction", "2024-06-10", [], {
        is_installment: true,
        installment_current: 2,
        installment_count: 5,
      }),
    ];
    render(
      <TransactionHistory
        transactions={data}
        isLoading={false}
        currentUserId="current-user-id"
      />
    );

    // Should show "-" for non-installment transactions and "2/5" for installment transactions
    const allDashElements = screen.getAllByText("-");
    expect(allDashElements.length).toBeGreaterThan(0);

    // Should show "2/5" for installment transactions (appears in both mobile and desktop layouts)
    const installmentElements = screen.getAllByText("2/5");
    expect(installmentElements.length).toBeGreaterThan(0);
  });
});
