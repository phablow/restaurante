-- Adicionar coluna sale_type à tabela sales
alter table public.sales
add column if not exists sale_type text default 'outros';

-- Adicionar comentário
comment on column public.sales.sale_type is 'Tipo de venda: marmita, pf, quilo, outros';
