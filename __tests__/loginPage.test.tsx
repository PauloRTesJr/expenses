import { render, screen } from "@testing-library/react";
import LoginPage from "../app/(auth)/login/page";

jest.mock("@/components/forms/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

describe("LoginPage", () => {
  it("renders login form and headings", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/create account/i)).toHaveAttribute("href", "/register");
  });
});
