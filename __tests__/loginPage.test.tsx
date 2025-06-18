import { render, screen } from "@testing-library/react";
import LoginPage from "../app/(auth)/login/page";
import { LocaleProvider } from "../components/providers/locale-provider";

jest.mock("@/components/forms/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

describe("LoginPage", () => {
  it("renders login form and headings", () => {
    render(
      <LocaleProvider>
        <LoginPage />
      </LocaleProvider>
    );
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByText(/bem-vindo de volta/i)).toBeInTheDocument();
    expect(screen.getByText(/criar conta/i)).toHaveAttribute("href", "/register");
  });
});
