import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../components/ui/input";

describe("Input Component", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("bg-[#2a2a2a]");
  });

  it("handles different input types", () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue("")).toHaveAttribute("type", "password");
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText("Type here");
    await user.type(input, "Hello World");

    expect(input).toHaveValue("Hello World");
  });

  it("handles onChange events", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} placeholder="Test input" />);

    const input = screen.getByPlaceholderText("Test input");
    await user.type(input, "test");

    expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
  });

  it("is disabled when disabled prop is true", () => {
    render(<Input disabled placeholder="Disabled input" />);

    const input = screen.getByPlaceholderText("Disabled input");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:opacity-50");
  });

  it("applies custom className", () => {
    render(<Input className="custom-input" />);

    expect(screen.getByRole("textbox")).toHaveClass("custom-input");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
