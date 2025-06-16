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

-- Adicionar campos de parcelamento à tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_count INTEGER,
ADD COLUMN IF NOT EXISTS installment_current INTEGER,
ADD COLUMN IF NOT EXISTS installment_group_id UUID;

-- Tornar category_id opcional (nullable)
ALTER TABLE transactions 
ALTER COLUMN category_id DROP NOT NULL;

-- Criar índice para melhor performance nas consultas de parcelamento
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group 
ON transactions(installment_group_id) 
WHERE installment_group_id IS NOT NULL;

-- Criar índice para consultas por usuário e tipo
CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
ON transactions(user_id, type);

-- Adicionar comentários para documentação
COMMENT ON COLUMN transactions.is_installment IS 'Indica se a transação é parcelada';
COMMENT ON COLUMN transactions.installment_count IS 'Número total de parcelas (se parcelado)';
COMMENT ON COLUMN transactions.installment_current IS 'Número da parcela atual (se parcelado)';
COMMENT ON COLUMN transactions.installment_group_id IS 'ID que agrupa todas as parcelas de uma transação parcelada';

-- Verificar se há dados existentes e atualizar o campo is_installment para false
UPDATE transactions 
SET is_installment = false 
WHERE is_installment IS NULL;

-- Migration: Add Shared Transactions Support
-- Date: 2025-06-06
-- Description: Implementa funcionalidade de transações compartilhadas (receitas/despesas divididas)

-- =====================================================
-- 1. CREATE TRANSACTION_SHARES TABLE
-- =====================================================

-- Tabela de junção para gerenciar compartilhamento de transações
CREATE TABLE IF NOT EXISTS transaction_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('equal', 'percentage', 'fixed_amount')),
  share_value DECIMAL(10,4), -- Para porcentagem (0.25 = 25%) ou valor fixo
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário só pode ter um compartilhamento por transação
  UNIQUE(transaction_id, shared_with_user_id),
  
  -- Validações de integridade de dados
  CHECK (
    (share_type = 'equal' AND share_value IS NULL) OR
    (share_type = 'percentage' AND share_value >= 0 AND share_value <= 1) OR
    (share_type = 'fixed_amount' AND share_value > 0)
  )
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Índices para otimizar consultas de compartilhamento
CREATE INDEX IF NOT EXISTS idx_transaction_shares_transaction_id 
ON transaction_shares(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_shares_user_id 
ON transaction_shares(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_shares_status 
ON transaction_shares(status);

-- Índice composto para consultas por usuário e status
CREATE INDEX IF NOT EXISTS idx_transaction_shares_user_status 
ON transaction_shares(shared_with_user_id, status);

-- =====================================================
-- 3. ADD NOTIFICATION PREFERENCES TO PROFILES
-- =====================================================

-- Adicionar preferências de notificação para transações compartilhadas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_shared_transactions BOOLEAN DEFAULT true;

-- =====================================================
-- 4. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Função para atualizar updated_at automaticamente (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger para updated_at na tabela transaction_shares
DROP TRIGGER IF EXISTS update_transaction_shares_updated_at ON transaction_shares;
CREATE TRIGGER update_transaction_shares_updated_at 
  BEFORE UPDATE ON transaction_shares 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS na nova tabela
ALTER TABLE transaction_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Política: Usuários podem ver compartilhamentos de transações que eles possuem
DROP POLICY IF EXISTS "Users can see shares for their transactions" ON transaction_shares;
CREATE POLICY "Users can see shares for their transactions" ON transaction_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_shares.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- Política: Usuários podem ver compartilhamentos onde eles são o usuário compartilhado
DROP POLICY IF EXISTS "Users can see shares assigned to them" ON transaction_shares;
CREATE POLICY "Users can see shares assigned to them" ON transaction_shares
  FOR SELECT USING (shared_with_user_id = auth.uid());

-- Política: Apenas donos da transação podem inserir/atualizar/deletar compartilhamentos
DROP POLICY IF EXISTS "Only transaction owners can manage shares" ON transaction_shares;
CREATE POLICY "Only transaction owners can manage shares" ON transaction_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_shares.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- Política: Usuários compartilhados podem atualizar seu status de aceitação
DROP POLICY IF EXISTS "Shared users can update their status" ON transaction_shares;
CREATE POLICY "Shared users can update their status" ON transaction_shares
  FOR UPDATE USING (shared_with_user_id = auth.uid())
  WITH CHECK (shared_with_user_id = auth.uid());

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Função para calcular o valor de compartilhamento de um usuário
CREATE OR REPLACE FUNCTION calculate_user_share_amount(
  p_transaction_id UUID,
  p_user_id UUID
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_transaction_amount DECIMAL(10,2);
  v_share_record RECORD;
  v_calculated_amount DECIMAL(10,2) := 0;
  v_equal_shares_count INTEGER := 0;
  v_total_percentage DECIMAL(10,4) := 0;
  v_total_fixed DECIMAL(10,2) := 0;
BEGIN
  -- Buscar o valor total da transação
  SELECT amount INTO v_transaction_amount 
  FROM transactions 
  WHERE id = p_transaction_id;
  
  IF v_transaction_amount IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Contar compartilhamentos do tipo 'equal' aceitos
  SELECT COUNT(*) INTO v_equal_shares_count
  FROM transaction_shares 
  WHERE transaction_id = p_transaction_id 
  AND share_type = 'equal' 
  AND status = 'accepted';
  
  -- Calcular totais de porcentagem e valor fixo
  SELECT 
    COALESCE(SUM(CASE WHEN share_type = 'percentage' AND status = 'accepted' THEN share_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN share_type = 'fixed_amount' AND status = 'accepted' THEN share_value ELSE 0 END), 0)
  INTO v_total_percentage, v_total_fixed
  FROM transaction_shares 
  WHERE transaction_id = p_transaction_id;
  
  -- Buscar o compartilhamento específico do usuário
  SELECT * INTO v_share_record
  FROM transaction_shares 
  WHERE transaction_id = p_transaction_id 
  AND shared_with_user_id = p_user_id
  AND status = 'accepted';
  
  IF v_share_record IS NOT NULL THEN
    -- Calcular com base no tipo de compartilhamento
    IF v_share_record.share_type = 'equal' THEN
      -- Dividir o valor restante após descontar porcentagens e valores fixos
      v_calculated_amount := (v_transaction_amount - v_total_fixed - (v_transaction_amount * v_total_percentage)) / (v_equal_shares_count + 1);
    ELSIF v_share_record.share_type = 'percentage' THEN
      v_calculated_amount := v_transaction_amount * v_share_record.share_value;
    ELSIF v_share_record.share_type = 'fixed_amount' THEN
      v_calculated_amount := v_share_record.share_value;
    END IF;
  ELSE
    -- Se não há compartilhamento, verificar se é o dono da transação
    IF EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id AND user_id = p_user_id) THEN
      -- Dono fica com o valor restante
      v_calculated_amount := v_transaction_amount - v_total_fixed - (v_transaction_amount * v_total_percentage);
      IF v_equal_shares_count > 0 THEN
        v_calculated_amount := v_calculated_amount - ((v_transaction_amount - v_total_fixed - (v_transaction_amount * v_total_percentage)) / (v_equal_shares_count + 1) * v_equal_shares_count);
      END IF;
    END IF;
  END IF;
  
  RETURN GREATEST(v_calculated_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para validar que usuário não compartilha consigo mesmo
CREATE OR REPLACE FUNCTION validate_no_self_sharing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared_with_user_id = (
    SELECT user_id FROM transactions WHERE id = NEW.transaction_id
  ) THEN
    RAISE EXCEPTION 'Usuário não pode compartilhar transação consigo mesmo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CREATE TRIGGERS
-- =====================================================

-- Trigger para validar auto-compartilhamento
DROP TRIGGER IF EXISTS prevent_self_sharing ON transaction_shares;
CREATE TRIGGER prevent_self_sharing
  BEFORE INSERT OR UPDATE ON transaction_shares
  FOR EACH ROW EXECUTE FUNCTION validate_no_self_sharing();

-- =====================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Comentários para documentação da tabela
COMMENT ON TABLE transaction_shares IS 'Gerencia compartilhamento de transações entre usuários';
COMMENT ON COLUMN transaction_shares.transaction_id IS 'ID da transação sendo compartilhada';
COMMENT ON COLUMN transaction_shares.shared_with_user_id IS 'ID do usuário com quem a transação está sendo compartilhada';
COMMENT ON COLUMN transaction_shares.share_type IS 'Tipo de compartilhamento: equal (divisão igual), percentage (porcentagem), fixed_amount (valor fixo)';
COMMENT ON COLUMN transaction_shares.share_value IS 'Valor do compartilhamento (porcentagem 0-1 ou valor monetário)';
COMMENT ON COLUMN transaction_shares.status IS 'Status do compartilhamento: pending, accepted, declined';

-- =====================================================
-- 11. SUCCESS NOTIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SHARED TRANSACTIONS MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 What was created:';
  RAISE NOTICE '   • transaction_shares table for managing shared transactions';
  RAISE NOTICE '   • RLS policies for secure data access';
  RAISE NOTICE '   • Performance indexes for fast queries';
  RAISE NOTICE '   • Helper functions for share calculations';
  RAISE NOTICE '   • Notification preferences in profiles';
  RAISE NOTICE '   • Validation constraints and triggers';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Shared transactions feature is now ready!';
  RAISE NOTICE '   • Users can share transaction costs with other users';
  RAISE NOTICE '   • Support for equal split, percentage, and fixed amounts';
  RAISE NOTICE '   • Acceptance/decline workflow for shared transactions';
  RAISE NOTICE '   • Automatic calculation of user share amounts';
END $$;

-- Migration: Enhance profiles table for comprehensive user management
-- Date: 2025-06-07
-- Purpose: Add user profile fields, preferences, and avatar support

-- =====================================================
-- 1. ENHANCE PROFILES TABLE
-- =====================================================

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'dd/MM/yyyy',
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS privacy_profile TEXT DEFAULT 'private' CHECK (privacy_profile IN ('public', 'private', 'friends')),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- =====================================================
-- 2. STORAGE BUCKET FOR AVATARS
-- =====================================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. STORAGE POLICIES FOR AVATARS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Users can view all avatars (public read)
CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND lower(right(name, 4)) IN ('.jpg', '.png', '.gif')
    OR lower(right(name, 5)) IN ('.jpeg', '.webp')
  );

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 4. UTILITY FUNCTIONS
-- =====================================================

-- Function to get avatar URL for a user
CREATE OR REPLACE FUNCTION get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_name TEXT;
  project_url TEXT := 'https://your-project.supabase.co'; -- Replace with actual project URL
BEGIN
  SELECT name INTO avatar_name
  FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND name LIKE user_id::text || '/%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF avatar_name IS NOT NULL THEN
    RETURN project_url || '/storage/v1/object/public/avatars/' || avatar_name;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate avatar URL in profile queries
CREATE OR REPLACE FUNCTION profiles_with_avatar()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  timezone TEXT,
  language TEXT,
  currency TEXT,
  date_format TEXT,
  notification_email BOOLEAN,
  notification_push BOOLEAN,
  notification_shared_transactions BOOLEAN,
  theme_preference TEXT,
  privacy_profile TEXT,
  onboarding_completed BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.bio,
    p.phone,
    p.location,
    p.website,
    p.timezone,
    p.language,
    p.currency,
    p.date_format,
    p.notification_email,
    p.notification_push,
    p.notification_shared_transactions,
    p.theme_preference,
    p.privacy_profile,
    p.onboarding_completed,
    get_avatar_url(p.id) as avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to create default profile for new users
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    email, 
    full_name,
    timezone,
    language,
    currency,
    date_format,
    theme_preference,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'BRL'),
    COALESCE(NEW.raw_user_meta_data->>'date_format', 'dd/MM/yyyy'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'dark'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to auto-create profile for new users
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- 5. PERFORMANCE INDEXES
-- =====================================================

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name) WHERE full_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Composite index for user search
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles(full_name, email) WHERE full_name IS NOT NULL;

-- =====================================================
-- 6. UPDATE EXISTING PROFILES (if any)
-- =====================================================

-- Update existing profiles with default values for new columns
UPDATE profiles 
SET 
  timezone = COALESCE(timezone, 'America/Sao_Paulo'),
  language = COALESCE(language, 'pt-BR'),
  currency = COALESCE(currency, 'BRL'),
  date_format = COALESCE(date_format, 'dd/MM/yyyy'),
  notification_email = COALESCE(notification_email, true),
  notification_push = COALESCE(notification_push, true),
  theme_preference = COALESCE(theme_preference, 'dark'),
  privacy_profile = COALESCE(privacy_profile, 'private'),
  onboarding_completed = COALESCE(onboarding_completed, false),
  updated_at = NOW()
WHERE timezone IS NULL 
   OR language IS NULL 
   OR currency IS NULL 
   OR date_format IS NULL 
   OR notification_email IS NULL 
   OR notification_push IS NULL 
   OR theme_preference IS NULL 
   OR privacy_profile IS NULL 
   OR onboarding_completed IS NULL;

-- =====================================================
-- 7. VIEWS FOR EASY QUERYING
-- =====================================================

-- Create view for user profiles with avatar URLs
CREATE OR REPLACE VIEW user_profiles_with_avatars AS
SELECT 
  p.*,
  get_avatar_url(p.id) as avatar_url
FROM profiles p;

-- Grant access to the view
ALTER VIEW user_profiles_with_avatars OWNER TO postgres;
GRANT SELECT ON user_profiles_with_avatars TO authenticated;

-- =====================================================
-- 8. VALIDATION CONSTRAINTS
-- =====================================================

-- Add constraints for data validation
ALTER TABLE profiles 
ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
ADD CONSTRAINT check_website_format CHECK (website IS NULL OR website ~* '^https?://.*$'),
ADD CONSTRAINT check_currency_code CHECK (currency ~* '^[A-Z]{3}$'),
ADD CONSTRAINT check_language_code CHECK (language ~* '^[a-z]{2}(-[A-Z]{2})?$');

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'Extended user profile information beyond authentication';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.phone IS 'User phone number in international format';
COMMENT ON COLUMN profiles.location IS 'User location or city';
COMMENT ON COLUMN profiles.website IS 'User personal website URL';
COMMENT ON COLUMN profiles.timezone IS 'User timezone preference';
COMMENT ON COLUMN profiles.language IS 'User language preference (ISO 639-1 format)';
COMMENT ON COLUMN profiles.currency IS 'User default currency (ISO 4217 format)';
COMMENT ON COLUMN profiles.date_format IS 'User preferred date format';
COMMENT ON COLUMN profiles.notification_email IS 'Email notification preference';
COMMENT ON COLUMN profiles.notification_push IS 'Push notification preference';
COMMENT ON COLUMN profiles.theme_preference IS 'UI theme preference';
COMMENT ON COLUMN profiles.privacy_profile IS 'Profile visibility setting';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user completed onboarding flow';

COMMENT ON FUNCTION get_avatar_url(UUID) IS 'Returns the public URL for a user avatar';
COMMENT ON FUNCTION profiles_with_avatar() IS 'Returns current user profile with avatar URL';
COMMENT ON VIEW user_profiles_with_avatars IS 'View combining profiles with avatar URLs';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250607_140000_enhance_profiles_table completed successfully';
  RAISE NOTICE 'Enhanced profiles table with user preferences and avatar support';
  RAISE NOTICE 'Created storage bucket and policies for avatars';
  RAISE NOTICE 'Added utility functions and performance indexes';
END $$;

-- Migration: Allow shared users to view transactions
-- Date: 2025-06-08
-- Description: Add RLS policy so users can read transactions shared with them

-- Ensure RLS is enabled on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a transaction is shared with a user
CREATE OR REPLACE FUNCTION is_transaction_shared_with_user(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM transaction_shares
    WHERE transaction_id = p_transaction_id
      AND shared_with_user_id = p_user_id
      AND status = 'accepted'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Policy to allow shared users to view transactions
DROP POLICY IF EXISTS "Users can view transactions shared with them" ON transactions;
CREATE POLICY "Users can view transactions shared with them" ON transactions
  FOR SELECT USING (
    is_transaction_shared_with_user(id, auth.uid())
  );


-- Enhanced User Profile System Migration
-- This migration enhances the existing profiles table with comprehensive user data
-- and sets up avatar storage with proper security policies

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'pt-BR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_shared_transactions BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_profile VARCHAR(10) DEFAULT 'public' CHECK (privacy_profile IN ('public', 'private', 'friends'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create storage bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enhanced RLS policies for profiles
DROP POLICY IF EXISTS "Users can view public profiles or their own" ON profiles;
CREATE POLICY "Users can view public profiles or their own" ON profiles
  FOR SELECT USING (
    privacy_profile = 'public' 
    OR id = auth.uid()
    OR (privacy_profile = 'friends' AND EXISTS (
      SELECT 1 FROM transaction_shares ts
      JOIN transactions t ON ts.transaction_id = t.id
      WHERE (ts.shared_with_user_id = auth.uid() AND t.user_id = profiles.id)
         OR (t.user_id = auth.uid() AND ts.shared_with_user_id = profiles.id)
    ))
  );

-- Function to create profile automatically with enhanced fields
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    email, 
    full_name,
    created_at,
    updated_at,
    timezone,
    language,
    currency,
    date_format,
    notification_email,
    notification_push,
    notification_shared_transactions,
    theme_preference,
    privacy_profile,
    onboarding_completed
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW(),
    'America/Sao_Paulo',
    'pt-BR',
    'BRL',
    'DD/MM/YYYY',
    true,
    true,
    true,
    'system',
    'public',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to use enhanced function
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search ON profiles USING gin(to_tsvector('portuguese', full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_email_search ON profiles USING gin(to_tsvector('portuguese', email));
CREATE INDEX IF NOT EXISTS idx_profiles_privacy ON profiles(privacy_profile);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Function to search users for sharing (respects privacy settings)
CREATE OR REPLACE FUNCTION search_users_for_sharing(search_query TEXT, current_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url
  FROM profiles p
  WHERE 
    p.id != current_user_id
    AND (
      p.privacy_profile = 'public'
      OR (p.privacy_profile = 'friends' AND EXISTS (
        SELECT 1 FROM transaction_shares ts
        JOIN transactions t ON ts.transaction_id = t.id
        WHERE (ts.shared_with_user_id = current_user_id AND t.user_id = p.id)
           OR (t.user_id = current_user_id AND ts.shared_with_user_id = p.id)
      ))
    )
    AND (
      LOWER(p.full_name) LIKE LOWER('%' || search_query || '%')
      OR LOWER(p.email) LIKE LOWER('%' || search_query || '%')
    )
  ORDER BY 
    CASE 
      WHEN LOWER(p.full_name) LIKE LOWER(search_query || '%') THEN 1
      WHEN LOWER(p.email) LIKE LOWER(search_query || '%') THEN 2
      ELSE 3
    END,
    p.full_name
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_users_for_sharing TO authenticated;

-- Comment on table and new columns
COMMENT ON TABLE profiles IS 'Enhanced user profiles with comprehensive personal data, preferences, and privacy controls';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.location IS 'User location or city';
COMMENT ON COLUMN profiles.website IS 'User personal or business website';
COMMENT ON COLUMN profiles.timezone IS 'User timezone for proper date/time formatting';
COMMENT ON COLUMN profiles.language IS 'User preferred language (ISO 639-1)';
COMMENT ON COLUMN profiles.currency IS 'User preferred currency (ISO 4217)';
COMMENT ON COLUMN profiles.date_format IS 'User preferred date format';
COMMENT ON COLUMN profiles.notification_email IS 'Email notification preferences';
COMMENT ON COLUMN profiles.notification_push IS 'Push notification preferences';
COMMENT ON COLUMN profiles.notification_shared_transactions IS 'Shared transaction notification preferences';
COMMENT ON COLUMN profiles.theme_preference IS 'UI theme preference (light/dark/system)';
COMMENT ON COLUMN profiles.privacy_profile IS 'Profile visibility settings';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding process';

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ FULL DATABASE SETUP COMPLETED SUCCESSFULLY!';
END $$;
