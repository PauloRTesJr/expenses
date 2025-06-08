import { supabaseConfig, validateSupabaseConfig } from "../lib/supabase/config";

describe("supabase config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports env vars", () => {
    expect(supabaseConfig.url).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
    expect(supabaseConfig.anonKey).toBe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });

  it("validates when vars missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = validateSupabaseConfig();
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBe(2);
  });

  it("validates success when vars present", () => {
    const res = validateSupabaseConfig();
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual([]);
  });
});
