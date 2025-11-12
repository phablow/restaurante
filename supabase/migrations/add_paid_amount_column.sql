-- Adicionar coluna paid_amount à tabela bills se não existir
-- Esta coluna armazena o valor efetivamente pago/recebido em casos de pagamento parcial

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'paid_amount'
  ) THEN 
    ALTER TABLE public.bills ADD COLUMN paid_amount numeric(12, 2);
  END IF;
END $$;

-- Comentar a coluna para documentação
COMMENT ON COLUMN public.bills.paid_amount IS 'Valor efetivamente pago/recebido (para pagamentos parciais)';
