import { render, screen, fireEvent } from "@testing-library/react";
import { UserAvatar } from "../components/profile/user-avatar";

jest.mock("next/image", () => ({ __esModule: true, default: (props: any) => (
  <img {...props} />
)}));

describe("UserAvatar", () => {
  it("renders fallback when no image", () => {
    render(<UserAvatar fallbackText="John" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("shows fallback on image error", () => {
    render(<UserAvatar src="/bad.png" fallbackText="A" />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("calls onClick handler", () => {
    const onClick = jest.fn();
    render(<UserAvatar onClick={onClick} />);
    const element = screen.getByText("\u{1F464}");
    fireEvent.click(element);
    expect(onClick).toHaveBeenCalled();
  });
});
