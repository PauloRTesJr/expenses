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