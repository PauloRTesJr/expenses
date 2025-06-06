-- 🗄️ UNIFIED DATABASE SETUP - Expenses App
-- Execute this COMPLETE script in Supabase Dashboard > SQL Editor
-- This script is idempotent and can be run multiple times safely

-- =====================================================
-- 1. EXTENSIONS & UTILITIES
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create exec_sql utility function for automation
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

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

-- Transactions table (with installment support)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES categories(id), -- Optional reference
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
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

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64) NOT NULL
);

-- =====================================================
-- 3. PERFORMANCE INDEXES
-- =====================================================

-- Transactions indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group ON transactions(installment_group_id) WHERE installment_group_id IS NOT NULL;

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, period);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- =====================================================
-- 5. UTILITY FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories (Portuguese)
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Salário', '#10B981', 'wallet', 'income', NEW.id),
    ('Freelance', '#3B82F6', 'laptop', 'income', NEW.id),
    ('Investimentos', '#8B5CF6', 'trending-up', 'income', NEW.id),
    ('Outros', '#6B7280', 'plus-circle', 'income', NEW.id);

  -- Expense categories (Portuguese)
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Updated_at triggers
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

-- Trigger to auto-create categories for new users
DROP TRIGGER IF EXISTS create_default_categories_trigger ON profiles;
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- =====================================================
-- 7. DATABASE CONSTRAINTS & VALIDATIONS
-- =====================================================

-- Add check constraints for data integrity
ALTER TABLE transactions 
ADD CONSTRAINT IF NOT EXISTS check_amount_positive 
CHECK (amount > 0);

ALTER TABLE budgets 
ADD CONSTRAINT IF NOT EXISTS check_budget_amount_positive 
CHECK (amount > 0);

-- Add constraint for installment validation
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS check_installment_logic
CHECK (
  (is_installment = false) OR 
  (is_installment = true AND installment_count > 0 AND installment_current > 0 AND installment_current <= installment_count)
);

-- =====================================================
-- 8. RECORD MIGRATION
-- =====================================================

-- Record this setup as a migration
INSERT INTO _migrations (version, name, filename, checksum) 
VALUES (
  '001',
  'Unified Database Setup',
  'unified-setup.sql',
  md5('unified-setup-v1.0')
) ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- 9. SUCCESS NOTIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ UNIFIED DATABASE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 What was created:';
  RAISE NOTICE '   • All tables: profiles, categories, transactions, budgets';
  RAISE NOTICE '   • All RLS policies for data security';
  RAISE NOTICE '   • Performance indexes for fast queries';
  RAISE NOTICE '   • Utility functions and triggers';
  RAISE NOTICE '   • Default categories for new users';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is ready! You can now:';
  RAISE NOTICE '   • Start your Next.js application';
  RAISE NOTICE '   • Test user registration and login';
  RAISE NOTICE '   • Create transactions and manage expenses';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps: Check SETUP.md for application configuration';
END $$;