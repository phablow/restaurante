-- Resetar saldos de todas as contas para 0
UPDATE public.accounts SET balance = 0;

-- Limpar transações internas (manter vendas e despesas para auditoria)
DELETE FROM public.internal_transactions;

-- Limpar pendências
DELETE FROM public.pendings;

-- Resetar liquidações (mantendo apenas as futuras)
DELETE FROM public.card_liquidations WHERE liquidated = true;
