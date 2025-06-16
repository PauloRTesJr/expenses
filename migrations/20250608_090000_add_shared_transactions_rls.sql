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
