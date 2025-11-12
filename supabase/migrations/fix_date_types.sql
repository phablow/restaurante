-- Migração para corrigir tipos de data e eliminar problemas de timezone

-- 1. Alterar sales table: date de timestamptz para date
ALTER TABLE public.sales 
  DROP COLUMN date,
  ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

-- 2. Alterar sales table: liquidation_date para date
ALTER TABLE public.sales
  DROP COLUMN liquidation_date,
  ADD COLUMN liquidation_date date;

-- 3. Alterar expenses table: date de timestamptz para date
ALTER TABLE public.expenses
  DROP COLUMN date,
  ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

-- 4. Alterar internal_transactions table: date de timestamptz para date
ALTER TABLE public.internal_transactions
  DROP COLUMN date,
  ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

-- 5. Alterar pendings table: date de timestamptz para date
ALTER TABLE public.pendings
  DROP COLUMN date,
  ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

-- 6. Alterar card_liquidations table: sale_date para date
ALTER TABLE public.card_liquidations
  DROP COLUMN sale_date,
  ADD COLUMN sale_date date NOT NULL DEFAULT CURRENT_DATE;

-- 7. Certificar que liquidation_date já é date (já foi criado assim)
-- card_liquidations.liquidation_date já é date, então não precisa alterar

-- Criar índices para melhor performance em queries de data
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_internal_transactions_date ON public.internal_transactions(date);
CREATE INDEX idx_pendings_date ON public.pendings(date);
CREATE INDEX idx_card_liquidations_sale_date ON public.card_liquidations(sale_date);
CREATE INDEX idx_card_liquidations_liquidation_date ON public.card_liquidations(liquidation_date);
