-- Adicionar coluna de valor pago nas contas
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2);

-- Alterar comentário da tabela para documentar
COMMENT ON COLUMN public.bills.paid_amount IS 'Valor efetivamente pago/recebido (para pagamentos parciais)';
