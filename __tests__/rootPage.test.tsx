import { redirect } from "next/navigation";
import HomePage from "../app/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Home page", () => {
  it("redirects to login", () => {
    HomePage();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
