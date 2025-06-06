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
 * Execute SQL query with error handling
 */
async function executeSQL(description: string, sql: string): Promise<void> {
  console.log(`🔄 ${description}...`);

  const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    console.error(`❌ Failed: ${description}`);
    console.error("Error:", error.message);
    throw error;
  }

  console.log(`✅ ${description} completed`);
}

/**
 * Execute SQL using direct Supabase query (alternative to exec_sql function)
 */
async function executeSQLDirect(
  description: string,
  sql: string
): Promise<void> {
  console.log(`🔄 ${description}...`);

  try {
    // Split SQL by semicolons and execute each statement separately
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        // Try to use rpc first, if it fails, we'll handle it
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: statement,
        });

        if (error && error.code === "PGRST202") {
          // exec_sql function doesn't exist, create it first
          if (statement.includes("CREATE OR REPLACE FUNCTION exec_sql")) {
            // This is the exec_sql function creation, we need to handle it specially
            console.log(
              "   📝 Creating exec_sql function manually in Supabase dashboard..."
            );
            console.log("\n🔧 MANUAL STEP REQUIRED:");
            console.log(
              "Please go to your Supabase dashboard > SQL Editor and run:"
            );
            console.log("\n```sql");
            console.log(`CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
            console.log("```\n");
            console.log("Then press ENTER to continue...");

            // Wait for user input
            const readline = require("readline");
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });

            await new Promise((resolve) => {
              rl.question(
                "Press ENTER after creating the function in Supabase dashboard...",
                () => {
                  rl.close();
                  resolve(void 0);
                }
              );
            });

            // Try again
            const { error: retryError } = await supabase.rpc("exec_sql", {
              sql_query: statement,
            });
            if (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        } else if (error) {
          throw error;
        }
      }
    }

    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Create SQL function for migrations (manual approach)
 */
async function createSQLFunction(): Promise<void> {
  const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  await executeSQLDirect("Creating SQL execution function", sql);
}

/**
 * Create database extensions
 */
async function createExtensions(): Promise<void> {
  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `;

  // For extensions, try direct approach first
  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    if (error && error.code === "PGRST202") {
      // Function doesn't exist yet, create it first
      await createSQLFunction();
      // Then try again
      const { error: retryError } = await supabase.rpc("exec_sql", {
        sql_query: sql,
      });
      if (retryError) throw retryError;
    } else if (error) {
      throw error;
    }
    console.log("✅ Creating database extensions completed");
  } catch (error) {
    console.error("❌ Failed: Creating database extensions");
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Create all tables
 */
async function createTables(): Promise<void> {
  const sql = `
    -- User profiles table (extends auth.users)
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(7) DEFAULT '#6B7280',
      icon VARCHAR(50) DEFAULT 'folder',
      type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(name, type, user_id)
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
      category_id UUID REFERENCES categories(id),
      date DATE NOT NULL,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      
      -- Installment fields
      is_installment BOOLEAN DEFAULT false,
      installment_count INTEGER,
      installment_current INTEGER,
      installment_group_id UUID,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Budgets table
    CREATE TABLE IF NOT EXISTS budgets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category_id UUID REFERENCES categories(id) NOT NULL,
      period VARCHAR(10) CHECK (period IN ('monthly', 'weekly', 'yearly')) NOT NULL,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await executeSQL("Creating tables", sql);
}

/**
 * Create indexes for better performance
 */
async function createIndexes(): Promise<void> {
  const sql = `
    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON transactions(user_id, date DESC);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
    ON transactions(user_id, type);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_installment_group 
    ON transactions(installment_group_id) 
    WHERE installment_group_id IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_categories_user_type 
    ON categories(user_id, type);
    
    CREATE INDEX IF NOT EXISTS idx_budgets_user_period 
    ON budgets(user_id, period);
  `;

  await executeSQL("Creating indexes", sql);
}

/**
 * Enable Row Level Security
 */
async function enableRLS(): Promise<void> {
  const sql = `
    -- Enable RLS on all tables
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
  `;

  await executeSQL("Enabling Row Level Security", sql);
}

/**
 * Create RLS policies
 */
async function createPolicies(): Promise<void> {
  const sql = `
    -- Profiles policies
    CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    -- Categories policies
    CREATE POLICY IF NOT EXISTS "Users can view their own categories" ON categories
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can create their own categories" ON categories
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can update their own categories" ON categories
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can delete their own categories" ON categories
      FOR DELETE USING (auth.uid() = user_id);

    -- Transactions policies
    CREATE POLICY IF NOT EXISTS "Users can view their own transactions" ON transactions
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can create their own transactions" ON transactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can update their own transactions" ON transactions
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can delete their own transactions" ON transactions
      FOR DELETE USING (auth.uid() = user_id);

    -- Budgets policies
    CREATE POLICY IF NOT EXISTS "Users can view their own budgets" ON budgets
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can create their own budgets" ON budgets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can update their own budgets" ON budgets
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can delete their own budgets" ON budgets
      FOR DELETE USING (auth.uid() = user_id);
  `;

  await executeSQL("Creating RLS policies", sql);
}

/**
 * Create triggers for updated_at fields
 */
async function createTriggers(): Promise<void> {
  const sql = `
    -- Function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create triggers for updated_at
    DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
    CREATE TRIGGER profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();

    DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
    CREATE TRIGGER transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();

    DROP TRIGGER IF EXISTS budgets_updated_at ON budgets;
    CREATE TRIGGER budgets_updated_at
        BEFORE UPDATE ON budgets
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
  `;

  await executeSQL("Creating triggers", sql);
}

/**
 * Create function to auto-create default categories for new users
 */
async function createDefaultCategoriesFunction(): Promise<void> {
  const sql = `
    -- Function to create default categories for new users
    CREATE OR REPLACE FUNCTION create_default_categories()
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
      EXECUTE FUNCTION create_default_categories();
  `;

  await executeSQL("Creating default categories function", sql);
}

/**
 * Main setup function
 */
async function setupDatabase(): Promise<void> {
  try {
    console.log("🚀 Setting up Supabase database...\n");

    await createExtensions();
    await createSQLFunction();
    await createTables();
    await createIndexes();
    await enableRLS();
    await createPolicies();
    await createTriggers();
    await createDefaultCategoriesFunction();

    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📋 What was created:");
    console.log("   ✅ Extensions (uuid-ossp, pgcrypto)");
    console.log("   ✅ Tables (profiles, categories, transactions, budgets)");
    console.log("   ✅ Indexes for performance");
    console.log("   ✅ Row Level Security policies");
    console.log("   ✅ Updated_at triggers");
    console.log("   ✅ Default categories function");
    console.log("\n🔄 Next steps:");
    console.log("   1. Run migrations: npm run migrate");
    console.log("   2. Test authentication flow");
    console.log("   3. Create your first transaction");
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
