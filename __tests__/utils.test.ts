import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  capitalize,
  truncate,
  slugify,
  isValidEmail,
  isValidCPF,
  groupBy,
  sortBy,
  unique,
  pick,
  omit,
  calculatePercentageChange,
  calculateTotal,
  calculateTotalByType,
} from "../lib/utils";

describe("Utils Functions", () => {
  describe("cn (className utility)", () => {
    it("combines class names correctly", () => {
      expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
      expect(cn("btn", undefined, "btn-primary")).toBe("btn btn-primary");
      expect(cn("btn", { "btn-active": true })).toBe("btn btn-active");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency in Brazilian Real", () => {
      // Use toMatch to handle non-breaking spaces
      expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(-500)).toMatch(/-R\$\s*500,00/);
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with Brazilian locale", () => {
      expect(formatNumber(1234.56)).toBe("1.234,56");
      expect(formatNumber(1000000)).toBe("1.000.000");
    });
  });

  describe("formatPercentage", () => {
    it("formats percentage values", () => {
      expect(formatPercentage(50)).toBe("50,0%");
      expect(formatPercentage(100)).toBe("100,0%");
      expect(formatPercentage(0)).toBe("0,0%");
    });
  });

  describe("formatDate", () => {
    it("formats dates correctly", () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      // Use UTC to avoid timezone issues
      const someDate = new Date("2023-01-15T12:00:00.000Z");

      expect(formatDate(today)).toBe("Hoje");
      expect(formatDate(yesterday)).toBe("Ontem");
      // Test with a more predictable date format
      expect(formatDate(someDate)).toMatch(/15\/01\/2023|14\/01\/2023/);
    });
  });

  describe("String utilities", () => {
    it("capitalizes strings", () => {
      expect(capitalize("hello world")).toBe("Hello world");
      expect(capitalize("UPPERCASE")).toBe("Uppercase");
    });

    it("truncates strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
      expect(truncate("Short", 10)).toBe("Short");
    });

    it("creates slugs from strings", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Café com Açúcar")).toBe("cafe-com-acucar");
    });
  });

  describe("Validation utilities", () => {
    it("validates email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
    });

    it("validates CPF numbers", () => {
      // Use known invalid CPFs
      expect(isValidCPF("111.111.111-11")).toBe(false); // All same digits
      expect(isValidCPF("123.456.789-00")).toBe(false); // Invalid checksum
      expect(isValidCPF("000.000.000-00")).toBe(false); // All zeros
      // Use a known valid CPF for positive test
      expect(isValidCPF("111.444.777-35")).toBe(true); // Valid CPF
    });
  });

  describe("Array utilities", () => {
    const testArray = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
      { id: 3, name: "Alice", age: 35 },
    ];

    it("groups array by key", () => {
      const grouped = groupBy(testArray, "name");
      expect(grouped.Alice).toHaveLength(2);
      expect(grouped.Bob).toHaveLength(1);
    });

    it("sorts array by key", () => {
      const sorted = sortBy(testArray, "age", "asc");
      expect(sorted[0].age).toBe(25);
      expect(sorted[2].age).toBe(35);
    });

    it("removes duplicates", () => {
      const duplicates = [1, 2, 2, 3, 3, 3];
      expect(unique(duplicates)).toEqual([1, 2, 3]);
    });
  });

  describe("Object utilities", () => {
    const testObj = { a: 1, b: 2, c: 3, d: 4 };

    it("picks specified keys", () => {
      expect(pick(testObj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });

    it("omits specified keys", () => {
      expect(omit(testObj, ["a", "c"])).toEqual({ b: 2, d: 4 });
    });
  });

  describe("Financial calculations", () => {
    it("calculates percentage change", () => {
      expect(calculatePercentageChange(120, 100)).toBe(20);
      expect(calculatePercentageChange(80, 100)).toBe(-20);
      expect(calculatePercentageChange(100, 0)).toBe(100);
    });

    it("calculates transaction totals", () => {
      const transactions = [
        { amount: 100, type: "income" as const },
        { amount: 50, type: "expense" as const },
        { amount: 200, type: "income" as const },
      ];

      expect(calculateTotal(transactions)).toBe(250); // 100 + 200 - 50
      expect(calculateTotalByType(transactions, "income")).toBe(300);
      expect(calculateTotalByType(transactions, "expense")).toBe(50);
    });
  });
});
