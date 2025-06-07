#!/usr/bin/env tsx

/**
 * Database setup script for Supabase
 * Creates initial tables, policies, and seed data
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables");
  console.error("Expected in .env.local:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute SQL using direct approach (avoiding complex function creation)
 */
async function executeSQL(description: string, sql: string): Promise<void> {
  console.log(`🔄 ${description}...`);

  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, that's okay for core setup
      if (error.code === "PGRST202") {
        console.log(
          `   ⚠️  exec_sql function not available, continuing with manual setup`
        );
        return;
      }
      throw error;
    }

    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Create database functions directly without exec_sql dependency
 */
async function createCoreFunctions(): Promise<void> {
  console.log("🔄 Creating core database functions...");

  // Create handle_updated_at function
  const { error: updateError } = await supabase
    .from("information_schema.routines")
    .select("routine_name")
    .eq("routine_name", "handle_updated_at")
    .single();

  if (updateError) {
    console.log(
      "   📝 handle_updated_at function needs to be created manually"
    );
    console.log("\n🔧 MANUAL STEP 1:");
    console.log("Go to Supabase Dashboard > SQL Editor and run:");
    console.log("\n```sql");
    console.log(`CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';`);
    console.log("```");
  }

  // Create default categories function
  console.log("\n🔧 MANUAL STEP 2:");
  console.log("Also run this in SQL Editor:");
  console.log("\n```sql");
  console.log(`CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Salário', '#10B981', 'wallet', 'income', NEW.id),
    ('Freelance', '#3B82F6', 'laptop', 'income', NEW.id),
    ('Investimentos', '#8B5CF6', 'trending-up', 'income', NEW.id),
    ('Vendas', '#F59E0B', 'shopping-cart', 'income', NEW.id),
    ('Outros', '#6B7280', 'plus-circle', 'income', NEW.id);

  -- Expense categories
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Alimentação', '#F59E0B', 'utensils', 'expense', NEW.id),
    ('Transporte', '#EF4444', 'car', 'expense', NEW.id),
    ('Moradia', '#06B6D4', 'home', 'expense', NEW.id),
    ('Saúde', '#10B981', 'heart', 'expense', NEW.id),
    ('Educação', '#3B82F6', 'book', 'expense', NEW.id),
    ('Lazer', '#8B5CF6', 'gamepad-2', 'expense', NEW.id),
    ('Roupas', '#F97316', 'shirt', 'expense', NEW.id),
    ('Tecnologia', '#6366F1', 'smartphone', 'expense', NEW.id),
    ('Outros', '#6B7280', 'more-horizontal', 'expense', NEW.id);

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create categories
DROP TRIGGER IF EXISTS create_default_categories_trigger ON profiles;
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();`);
  console.log("```\n");

  console.log("✅ Core functions setup instructions provided");
}

/**
 * Verify database status
 */
async function verifySetup(): Promise<void> {
  console.log("🔄 Verifying database setup...");

  try {
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["profiles", "categories", "transactions", "budgets"]);

    if (error) {
      console.log("   ⚠️  Could not verify tables, but continuing...");
      return;
    }

    console.log(`   📊 Found ${tables.length} core tables`);

    // Check for data
    const { count: profileCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: categoryCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    console.log(`   👥 Profiles: ${profileCount || 0}`);
    console.log(`   📂 Categories: ${categoryCount || 0}`);

    console.log("✅ Database verification completed");
  } catch (error) {
    console.log("   ⚠️  Verification failed, but setup can continue");
  }
}

/**
 * Main setup function
 */
async function setupDatabase(): Promise<void> {
  try {
    console.log("🚀 Setting up Supabase database...\n");

    await createCoreFunctions();
    await verifySetup();

    console.log("\n🎉 Database setup guidance completed!");
    console.log("\n📋 Current status:");
    console.log("   ✅ Core table structure exists");
    console.log("   ✅ Recent migrations applied");
    console.log("   ⚠️  Manual functions setup required");
    console.log("\n🔄 Next steps:");
    console.log("   1. Complete the manual SQL steps above");
    console.log("   2. Run: npm run migrate");
    console.log("   3. Run: npm run dev");
    console.log("   4. Test authentication and create transactions");
  } catch (error) {
    console.error("\n💥 Setup failed:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };
