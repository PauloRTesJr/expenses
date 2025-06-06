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