#!/usr/bin/env tsx

/**
 * Simple database setup script for Supabase
 * Creates initial tables and policies using basic operations
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
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Setup database with manual SQL instructions
 */
async function setupDatabaseManual(): Promise<void> {
  try {
    console.log("🚀 Setting up Supabase database...\n");

    console.log(
      "📋 Since we need to create functions and policies, please run the following SQL in your Supabase dashboard:"
    );
    console.log("\n1. Go to your Supabase dashboard > SQL Editor");
    console.log("2. Copy and run this complete SQL script:\n");

    const setupSQL = `
-- 1. Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create exec_sql function for future automation
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create tables (if they don't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES categories(id),
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  is_installment BOOLEAN DEFAULT false,
  installment_count INTEGER,
  installment_current INTEGER,
  installment_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group ON transactions(installment_group_id) 
WHERE installment_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, period);

-- 5. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own budgets" ON budgets;
CREATE POLICY "Users can create their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create updated_at trigger function
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

-- 8. Create default categories function
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

-- 9. Create migrations table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64) NOT NULL
);
`;

    console.log("```sql");
    console.log(setupSQL);
    console.log("```\n");

    // Wait for user confirmation
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise<void>((resolve) => {
      rl.question(
        "After running the SQL script above, press ENTER to validate the setup...",
        () => {
          rl.close();
          resolve();
        }
      );
    });

    // Test if everything was created correctly
    console.log("🔍 Validating setup...\n");

    // Test exec_sql function
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: "SELECT 1;",
      });

      if (error) {
        console.log(
          "❌ exec_sql function not found. Please make sure you ran the SQL script."
        );
        return;
      }

      console.log("✅ exec_sql function working");
    } catch (error) {
      console.log("❌ Failed to test exec_sql function");
      return;
    }

    // Test tables
    const tables = [
      "profiles",
      "categories",
      "transactions",
      "budgets",
      "_migrations",
    ];
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table as any)
          .select("*", { count: "exact", head: true });

        if (error && error.code === "PGRST116") {
          console.log(`❌ Table '${table}' not found`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch {
        console.log(`❌ Error checking table '${table}'`);
      }
    }

    console.log("\n🎉 Database setup validation completed!");
    console.log("\n🔄 Next steps:");
    console.log("   1. Run: npm run migrate");
    console.log("   2. Run: npm run db:status");
    console.log("   3. Test your application");
  } catch (error) {
    console.error("\n💥 Setup failed:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabaseManual();
}

export { setupDatabaseManual };
