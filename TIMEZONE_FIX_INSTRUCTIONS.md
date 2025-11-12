# Solução Definitiva para Problema de Timezone - Instruções Passo a Passo

## 🔴 Problema
Vendas/despesas estão sendo registradas no dia anterior ao escolhido.

## ✅ Causa Raiz
O Supabase estava armazenando as datas em `timestamptz` (timestamp with timezone), o que causava conversão automática de timezone. Mesmo enviando `2025-11-12`, o PostgreSQL interpretava como `2025-11-12 00:00:00 UTC` e convergia para `2025-11-11 22:00:00 -02:00` (horário de Brasília).

## 🔧 Solução Implementada

Alterar os tipos de coluna de data de `timestamptz` para `date` (sem timezone). Isso é mais apropriado para este caso de uso onde só nos importa a data local, não a hora precisa com timezone.

### Tabelas a serem alteradas:
1. **sales** - coluna `date` e `liquidation_date`
2. **expenses** - coluna `date`
3. **internal_transactions** - coluna `date`
4. **pendings** - coluna `date`
5. **card_liquidations** - coluna `sale_date`

## 📋 Como Executar

### Opção 1: Usando Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Acesse seu projeto "restaurantedonanide"
3. Vá para **SQL Editor** (lado esquerdo)
4. Clique em **New query**
5. Cole o seguinte SQL:

```sql
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

-- 7. Criar índices para melhor performance
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_internal_transactions_date ON public.internal_transactions(date);
CREATE INDEX idx_pendings_date ON public.pendings(date);
CREATE INDEX idx_card_liquidations_sale_date ON public.card_liquidations(sale_date);
CREATE INDEX idx_card_liquidations_liquidation_date ON public.card_liquidations(liquidation_date);
```

6. Clique em **Run** (botão azul)
7. Aguarde a conclusão (deve levar alguns segundos)

### ⚠️ Importante: Backup de Dados

Antes de executar qualquer alteração no banco:

```sql
-- Exportar dados das tabelas (execute ANTES da migração)
SELECT * FROM public.sales ORDER BY created_at;
SELECT * FROM public.expenses ORDER BY created_at;
SELECT * FROM public.internal_transactions ORDER BY created_at;
SELECT * FROM public.pendings ORDER BY created_at;
SELECT * FROM public.card_liquidations ORDER BY created_at;
```

Se tiver dados importantes, você pode salvar em JSON ou CSV através do dashboard do Supabase antes da migração.

## 🧪 Verificação Após Execução

1. No Supabase Dashboard, vá para **Table Editor**
2. Clique em cada tabela e verifique que as colunas `date` agora são do tipo `date` (não `timestamptz`)
3. Teste no front-end:
   - Registre uma venda/despesa com data de hoje
   - Recarregue a página
   - Verifique se a data está correta no Extratos

## 📌 Próximos Passos

Após executar a migração:
1. Não é necessário alterar nada no código do front-end
2. Todas as datas continuarão funcionando normalmente
3. O problema de timezone será eliminado completamente
4. As datas serão sempre armazenadas no fuso horário local do Brasil

## 💡 Por que isso funciona

- **DATE**: Armazena apenas a data (YYYY-MM-DD) sem informação de hora ou timezone
- Elimina completamente interpretações incorretas de timezone
- É o tipo apropriado quando você só se importa com a data, não com a hora exata
- Mais simples e mais seguro para este caso de uso

## ❓ Dúvidas?

Se der algum erro durante a execução:
1. Anote a mensagem de erro exata
2. Reverta para o backup se necessário
3. Contacte o suporte do Supabase ou refaça seguindo os passos acima
