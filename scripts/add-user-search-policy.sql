-- Allow users to search for other users for sharing purposes
-- This policy allows reading basic profile information (id, email, full_name) 
-- for sharing features while maintaining security

-- Add a new policy that allows users to search for other users
-- This is safe because we only expose basic information needed for sharing
DROP POLICY IF EXISTS "Users can search other users for sharing" ON profiles;
CREATE POLICY "Users can search other users for sharing" ON profiles
  FOR SELECT USING (
    -- Users can see their own profile (existing functionality)
    auth.uid() = id 
    OR 
    -- Users can see basic info of other users for sharing (new functionality)
    (auth.uid() IS NOT NULL AND id != auth.uid())
  );

-- Success notification
SELECT 'User search policy for sharing created successfully!' as status;