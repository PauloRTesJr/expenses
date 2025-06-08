import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../components/ui/modal";

describe("Modal component", () => {
  it("renders when open and handles close", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>content</div>
      </Modal>
    );

    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Hi">
        <div>hidden</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });
});
