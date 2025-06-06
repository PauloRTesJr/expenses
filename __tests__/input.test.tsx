import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../components/ui/input";

describe("Input Component", () => {
  describe("Basic Functionality", () => {
    it("renders with default props", () => {
      render(<Input placeholder="Enter text" />);

      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveClass("bg-[rgba(36,43,61,0.85)]");
    });

    it("handles different input types", () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

      rerender(<Input type="password" />);
      expect(screen.getByDisplayValue("")).toHaveAttribute("type", "password");

      rerender(<Input type="number" />);
      expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
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

    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("applies custom className", () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole("textbox")).toHaveClass("custom-input");
    });
  });

  describe("Size Variants", () => {
    it("renders small size correctly", () => {
      render(<Input size="small" placeholder="Small input" />);
      const input = screen.getByPlaceholderText("Small input");
      expect(input).toHaveClass("h-8", "px-3", "py-1", "text-sm");
    });

    it("renders default size correctly", () => {
      render(<Input size="default" placeholder="Default input" />);
      const input = screen.getByPlaceholderText("Default input");
      expect(input).toHaveClass("h-10", "px-3", "py-2", "text-sm");
    });

    it("renders large size correctly", () => {
      render(<Input size="large" placeholder="Large input" />);
      const input = screen.getByPlaceholderText("Large input");
      expect(input).toHaveClass("h-12", "px-4", "py-3", "text-base");
    });

    it("defaults to default size when no size prop is provided", () => {
      render(<Input placeholder="No size prop" />);
      const input = screen.getByPlaceholderText("No size prop");
      expect(input).toHaveClass("h-10", "px-3", "py-2", "text-sm");
    });
  });

  describe("Status States", () => {
    it("renders default status correctly", () => {
      render(<Input status="default" placeholder="Default status" />);
      const input = screen.getByPlaceholderText("Default status");
      expect(input).toHaveClass("border-gray-600");
    });

    it("renders error status correctly", () => {
      render(<Input status="error" placeholder="Error status" />);
      const input = screen.getByPlaceholderText("Error status");
      expect(input).toHaveClass("border-red-500", "bg-red-500/5");
    });

    it("renders warning status correctly", () => {
      render(<Input status="warning" placeholder="Warning status" />);
      const input = screen.getByPlaceholderText("Warning status");
      expect(input).toHaveClass("border-amber-500", "bg-amber-500/5");
    });

    it("renders success status correctly", () => {
      render(<Input status="success" placeholder="Success status" />);
      const input = screen.getByPlaceholderText("Success status");
      expect(input).toHaveClass("border-green-500", "bg-green-500/5");
    });
  });

  describe("Prefix and Suffix", () => {
    it("renders with prefix icon", () => {
      const prefix = <span data-testid="prefix-icon">$</span>;
      render(<Input prefix={prefix} placeholder="With prefix" />);

      expect(screen.getByTestId("prefix-icon")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("With prefix")).toBeInTheDocument();
    });

    it("renders with suffix icon", () => {
      const suffix = <span data-testid="suffix-icon">@</span>;
      render(<Input suffix={suffix} placeholder="With suffix" />);

      expect(screen.getByTestId("suffix-icon")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("With suffix")).toBeInTheDocument();
    });

    it("renders with both prefix and suffix", () => {
      const prefix = <span data-testid="prefix-icon">$</span>;
      const suffix = <span data-testid="suffix-icon">@</span>;
      render(<Input prefix={prefix} suffix={suffix} placeholder="With both" />);

      expect(screen.getByTestId("prefix-icon")).toBeInTheDocument();
      expect(screen.getByTestId("suffix-icon")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("With both")).toBeInTheDocument();
    });

    it("applies correct container classes when affixes are present", () => {
      const prefix = <span>$</span>;
      const { container } = render(
        <Input prefix={prefix} placeholder="Test" />
      );

      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("relative", "inline-flex", "items-center");
    });
  });

  describe("Allow Clear Functionality", () => {
    it("shows clear button when allowClear is true and input has value", () => {
      render(<Input allowClear value="test value" onChange={() => {}} />);

      const clearButton = screen.getByRole("button");
      expect(clearButton).toBeInTheDocument();
    });

    it("does not show clear button when allowClear is true but input is empty", () => {
      render(<Input allowClear value="" onChange={() => {}} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not show clear button when allowClear is false", () => {
      render(
        <Input allowClear={false} value="test value" onChange={() => {}} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("calls onChange with empty value when clear button is clicked", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input allowClear value="test value" onChange={handleChange} />);

      const clearButton = screen.getByRole("button");
      await user.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: "" }),
        })
      );
    });

    it("does not show clear button when input is disabled", () => {
      render(
        <Input allowClear value="test value" disabled onChange={() => {}} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("is disabled when disabled prop is true", () => {
      render(<Input disabled placeholder="Disabled input" />);

      const input = screen.getByPlaceholderText("Disabled input");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("disabled:opacity-60");
    });

    it("applies disabled styles to container when affixes are present", () => {
      const prefix = <span>$</span>;
      const { container } = render(
        <Input prefix={prefix} disabled placeholder="Disabled" />
      );

      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("opacity-60", "cursor-not-allowed");
    });

    it("prevents user interaction when disabled", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input disabled onChange={handleChange} placeholder="Disabled" />);

      const input = screen.getByPlaceholderText("Disabled");
      await user.type(input, "test");

      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue("");
    });
  });

  describe("Focus Behavior", () => {
    it("applies focus styles on focus", async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Focus test" />);

      const input = screen.getByPlaceholderText("Focus test");
      await user.click(input);

      expect(input).toHaveFocus();
    });

    it("handles focus with prefix and suffix", async () => {
      const user = userEvent.setup();
      const prefix = <span>$</span>;
      const suffix = <span>@</span>;

      render(
        <Input
          prefix={prefix}
          suffix={suffix}
          placeholder="Focus with affixes"
        />
      );

      const input = screen.getByPlaceholderText("Focus with affixes");
      await user.click(input);

      expect(input).toHaveFocus();
    });
  });

  describe("Container Class Name", () => {
    it("applies custom container className when affixes are present", () => {
      const prefix = <span>$</span>;
      const { container } = render(
        <Input
          prefix={prefix}
          containerClassName="custom-container"
          placeholder="Test"
        />
      );

      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("custom-container");
    });

    it("does not affect input when no affixes are present", () => {
      render(
        <Input containerClassName="custom-container" placeholder="Test" />
      );

      const input = screen.getByPlaceholderText("Test");
      expect(input).not.toHaveClass("custom-container");
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined value gracefully", () => {
      render(<Input value={undefined} onChange={() => {}} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("handles null prefix gracefully", () => {
      render(<Input prefix={null} placeholder="Null prefix" />);

      expect(screen.getByPlaceholderText("Null prefix")).toBeInTheDocument();
    });

    it("handles null suffix gracefully", () => {
      render(<Input suffix={null} placeholder="Null suffix" />);

      expect(screen.getByPlaceholderText("Null suffix")).toBeInTheDocument();
    });

    it("handles complex React nodes as prefix/suffix", () => {
      const complexPrefix = (
        <div data-testid="complex-prefix">
          <span>$</span>
          <span>USD</span>
        </div>
      );

      render(<Input prefix={complexPrefix} placeholder="Complex prefix" />);

      expect(screen.getByTestId("complex-prefix")).toBeInTheDocument();
    });

    it("maintains input functionality with various combinations", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Input
          size="large"
          status="success"
          prefix={<span>$</span>}
          suffix={<span>.00</span>}
          allowClear
          onChange={handleChange}
          placeholder="Complex input"
        />
      );

      const input = screen.getByPlaceholderText("Complex input");
      await user.type(input, "123");

      expect(input).toHaveValue("123");
      expect(handleChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("maintains proper tab order with clear button", () => {
      render(<Input allowClear value="test" onChange={() => {}} />);

      const clearButton = screen.getByRole("button");
      expect(clearButton).toHaveAttribute("tabIndex", "-1");
    });

    it("provides appropriate ARIA attributes", () => {
      render(<Input placeholder="Accessible input" aria-label="Test input" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", "Test input");
    });

    it("supports custom ARIA attributes", () => {
      render(
        <Input
          placeholder="ARIA test"
          aria-describedby="helper-text"
          aria-invalid="true"
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "helper-text");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});
