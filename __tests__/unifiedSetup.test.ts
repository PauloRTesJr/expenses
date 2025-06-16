import fs from "fs";

describe("unified setup sql", () => {
  it("includes shared transactions table", () => {
    const sql = fs.readFileSync("scripts/unified-setup.sql", "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS transaction_shares/);
  });
});
