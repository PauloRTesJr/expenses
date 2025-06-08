import {
  formatDateTime,
  formatRelativeDate,
  formatMonthYear,
  getTransactionTypeColor,
  getCategoryColor,
  storage,
  debounce,
  buildUrl,
} from "../lib/utils";

describe("Additional utils", () => {
  it("formats date and time correctly", () => {
    const date = new Date("2024-05-15T10:30:00Z");
    expect(formatDateTime(date)).toMatch(/15\/05\/2024.*10:30/);
  });

  it("formats relative date", () => {
    const date = new Date();
    expect(formatRelativeDate(date)).toContain("há");
  });

  it("formats month and year", () => {
    const date = new Date("2023-02-01T00:00:00Z");
    expect(formatMonthYear(date)).toMatch(/fevereiro 2023/i);
  });

  it("returns transaction type colors", () => {
    expect(getTransactionTypeColor("income")).toEqual({
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200",
    });
    expect(getTransactionTypeColor("expense")).toEqual({
      bg: "bg-red-100",
      text: "text-red-600",
      border: "border-red-200",
    });
  });

  it("picks a default category color if none provided", () => {
    const color = getCategoryColor();
    expect(typeof color).toBe("string");
    expect(color.startsWith("#")).toBe(true);
    expect(color.length).toBe(7);
  });

  it("handles storage operations", () => {
    storage.set("key", { a: 1 });
    expect(storage.get("key")).toEqual({ a: 1 });
    storage.remove("key");
    expect(storage.get("key")).toBeNull();
    storage.set("k2", 2);
    storage.clear();
    expect(storage.get("k2")).toBeNull();
  });

  it("debounces function calls", () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("builds urls with params", () => {
    const url = buildUrl("/test", { a: 1, b: "x" });
    expect(url).toContain("a=1");
    expect(url).toContain("b=x");
  });
});
