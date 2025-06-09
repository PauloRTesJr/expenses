import * as ui from "../components/ui";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

describe("ui index exports", () => {
  it("re-exports Button and Input", () => {
    expect(ui.Button).toBe(Button);
    expect(ui.Input).toBe(Input);
  });
});
