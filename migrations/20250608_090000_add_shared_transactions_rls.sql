-- Migration: Allow shared users to view transactions
-- Date: 2025-06-08
-- Description: Add RLS policy so users can read transactions shared with them

-- Ensure RLS is enabled on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow shared users to view transactions
DROP POLICY IF EXISTS "Users can view transactions shared with them" ON transactions;
CREATE POLICY "Users can view transactions shared with them" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transaction_shares
      WHERE transaction_shares.transaction_id = transactions.id
        AND transaction_shares.shared_with_user_id = auth.uid()
        AND transaction_shares.status = 'accepted'
    )
  );
