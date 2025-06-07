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