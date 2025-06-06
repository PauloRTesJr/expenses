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