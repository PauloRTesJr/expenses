import React from "react";
import RootLayout from "../app/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

describe("RootLayout", () => {
  it("renders children and applies font classes", () => {
    const result: any = RootLayout({ children: <span>content</span> });
    expect(result.type).toBe("html");
    expect(result.props.children.props.className).toContain("geist");
    expect(result.props.children.props.className).toContain("geist-mono");
    expect(
      result.props.children.props.children.props.children.props.children
    ).toBe("content");
  });
});
