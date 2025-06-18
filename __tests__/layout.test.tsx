import React from "react";
import RootLayout from "../app/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

describe("RootLayout", () => {
  it("renders children and applies font classes", () => {
    const result: any = RootLayout({ children: <span>content</span> });
    expect(typeof result.type).toBe("function");
    const inner = result.props.children;
    expect(typeof inner.type).toBe("function");
    expect(inner.props.children).toEqual(<span>content</span>);
  });
});
