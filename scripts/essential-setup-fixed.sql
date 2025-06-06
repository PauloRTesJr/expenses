-- CORRECTED: Essential setup for the expenses app
-- Execute this in Supabase Dashboard > SQL Editor

-- 1. Create exec_sql function for automation
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add installment support to transactions (if not exists)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_count INTEGER,
ADD COLUMN IF NOT EXISTS installment_current INTEGER,
ADD COLUMN IF NOT EXISTS installment_group_id UUID;

-- 3. Make category_id optional in transactions
DO $$
BEGIN
  ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore if constraint doesn't exist
END $$;

-- 4. Enable RLS on tables (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (using proper PostgreSQL syntax)
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

-- 6. Create essential functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create updated_at triggers
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

-- 8. Create default categories function for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Salário', '#10B981', 'wallet', 'income', NEW.id),
    ('Freelance', '#3B82F6', 'laptop', 'income', NEW.id),
    ('Investimentos', '#8B5CF6', 'trending-up', 'income', NEW.id),
    ('Outros', '#6B7280', 'plus-circle', 'income', NEW.id);

  -- Expense categories  
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Alimentação', '#F59E0B', 'utensils', 'expense', NEW.id),
    ('Transporte', '#EF4444', 'car', 'expense', NEW.id),
    ('Moradia', '#06B6D4', 'home', 'expense', NEW.id),
    ('Saúde', '#10B981', 'heart', 'expense', NEW.id),
    ('Lazer', '#8B5CF6', 'gamepad-2', 'expense', NEW.id),
    ('Outros', '#6B7280', 'more-horizontal', 'expense', NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-create categories for new users
DROP TRIGGER IF EXISTS create_default_categories_trigger ON profiles;
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- 10. Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
END $$;