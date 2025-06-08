import {
  validateLogin,
  validateRegister,
  validateTransaction,
  validateBudget,
  validateCategory,
  validateProfile,
} from "../lib/validations";

describe("Validation Schemas", () => {
  it("validates login data", () => {
    const result = validateLogin({ email: "a@b.com", password: "secret" });
    expect(result.success).toBe(true);
    const fail = validateLogin({ email: "wrong", password: "123" });
    expect(fail.success).toBe(false);
  });

  it("validates register data with mismatched passwords", () => {
    const res = validateRegister({
      email: "a@b.com",
      password: "123456",
      confirmPassword: "000000",
    });
    expect(res.success).toBe(false);
  });

  it("validates transaction data", () => {
    const ok = validateTransaction({
      description: "Test",
      amount: 10,
      type: "income",
      category_id: "7b54e3ce-2ce1-4b57-9f92-123456789abc",
      date: new Date("2020-01-01T00:00:00Z"),
    });
    expect(ok.success).toBe(true);
  });

  it("invalid budget with high amount", () => {
    const res = validateBudget({
      name: "Budget",
      amount: 1000000,
      category_id: "7b54e3ce-2ce1-4b57-9f92-123456789abc",
      period: "monthly",
    });
    expect(res.success).toBe(false);
  });

  it("category requires hex color", () => {
    const res = validateCategory({
      name: "Cat",
      color: "#ZZZZZZ",
      icon: "icon",
      type: "income",
    });
    expect(res.success).toBe(false);
  });

  it("profile email is required", () => {
    const res = validateProfile({ email: "" });
    expect(res.success).toBe(false);
  });
});
