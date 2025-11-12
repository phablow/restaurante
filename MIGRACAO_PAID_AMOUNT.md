# Como Executar Migrações no Supabase

## Problema Atual
A coluna `paid_amount` não existe na tabela `bills`. A migração foi criada mas não executada.

## Solução

### Opção 1: Executar via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Vá para seu projeto "restaurantedonanide"
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **New query**
5. Cole este SQL:

```sql
-- Adicionar coluna paid_amount se não existir
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2);

-- Adicionar coluna updated_at se não existir
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Verificar se foi criado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position;
```

6. Clique em **Run**
7. Aguarde a execução

### Verificar se funcionou

1. Vá para **Table Editor**
2. Clique na tabela `bills`
3. Procure pelas colunas `paid_amount` e `updated_at`
4. Devem aparecer na lista de colunas

### Se der erro

Se der erro tipo:
```
ERROR: column "paid_amount" of relation "bills" already exists
```

Significa que a coluna já existe. Neste caso, o problema é outra coisa. Rode este SQL para diagnosticar:

```sql
-- Ver todas as colunas de bills
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bills'
ORDER BY ordinal_position;
```

### Depois de Executar

1. Recarregue a página (Ctrl+F5)
2. Tente registrar uma conta novamente
3. Deve funcionar agora!

## Checklist de Migrações Obrigatórias

Todas estas migrações devem ser executadas no Supabase:

- [x] `complete_schema.sql` - Schema inicial
- [x] `20251109144645_*.sql` - Primeira migração
- [x] `20251109144720_*.sql` - Segunda migração
- [ ] `add_paid_amount_column.sql` - **← EXECUTE AGORA**
- [ ] `fix_date_types.sql` - Opcional (converte timestamptz para date)

## Próximos Passos

1. Execute o SQL acima
2. Recarregue e teste
3. Se funcionar, faça commit: `git add . && git commit -m "Add paid_amount column to bills table"`
4. Push: `git push origin main`
