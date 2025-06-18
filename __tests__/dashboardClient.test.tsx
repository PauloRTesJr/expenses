import { render, screen } from "@testing-library/react";
import { DashboardClient } from "../app/dashboard/dashboard-client";
import { LocaleProvider } from "../components/providers/locale-provider";

jest.mock("../components/forms/transaction-form", () => ({
  TransactionForm: () => <div data-testid="transaction-form" />,
}));

jest.mock("../components/dashboard/metrics-cards", () => ({
  MetricsCards: () => <div data-testid="metrics-cards" />,
}));

jest.mock("../components/dashboard/transaction-history", () => ({
  TransactionHistory: () => <div data-testid="transaction-history" />,
}));

jest.mock("../components/dashboard/monthly-and-yearly-charts", () => ({
  MonthlyAndYearlyCharts: () => <div data-testid="charts" />,
}));

jest.mock("../components/profile/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

jest.mock("../hooks/use-profile", () => ({
  useProfile: () => ({ profile: null, loading: false }),
}));

jest.mock("../lib/transactions/service", () => ({
  TransactionsService: {
    fetchTransactionsWithShares: jest.fn().mockResolvedValue([]),
    createSharedTransaction: jest.fn(),
  },
}));

jest.mock("../lib/supabase/client", () => ({
  createClientSupabase: () => ({ from: jest.fn(() => ({ insert: jest.fn() })) }),
}));

describe("DashboardClient", () => {
  it("renders wrapped with QueryClientProvider", async () => {
    render(
      <LocaleProvider>
        <DashboardClient user={{ id: "1" } as any} categories={[]} />
      </LocaleProvider>
    );
    expect(await screen.findByTestId("metrics-cards")).toBeInTheDocument();
  });
});
