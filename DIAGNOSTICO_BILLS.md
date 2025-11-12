# Diagnóstico - Bills não salvando no Supabase

## Checklist de Verificação

### 1. Verificar RLS Policies no Supabase
No Dashboard do Supabase, vá para:
- **Authentication → Policies**
- Procure pela tabela `bills`
- Verifique se há policies que PERMITEM INSERT

Deve haver algo como:
```sql
CREATE POLICY "Admins podem criar contas"
  ON public.bills FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### 2. Verificar se o usuário é admin
Execute no SQL Editor do Supabase:
```sql
SELECT * FROM public.user_roles 
WHERE user_id = auth.uid();
```

Deve retornar uma linha com `role: 'admin'`. Se não retornar nada, o usuário não é admin!

### 3. Solução rápida - Criar role de admin se necessário
```sql
-- Substitua USER_ID_AQUI pelo ID do seu usuário (pode ver em auth.users)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin');
```

### 4. Verificar se há erro no console do navegador
1. Abra DevTools (F12)
2. Vá para a aba **Console**
3. Tente registrar uma conta
4. Procure por mensagens de erro vermelhas
5. Copie toda a mensagem de erro

### 5. Verificar se o usuário está autenticado
No console do navegador, execute:
```javascript
// Verificar se há sessão ativa
console.log(supabase.auth.session());
```

## Passos para Resolver

1. **Se o usuário não é admin:**
   - Execute o SQL em "Solução rápida" acima
   - Recarregue a página (Ctrl+F5)
   - Tente registrar novamente

2. **Se o erro continua:**
   - Abra DevTools (F12)
   - Na aba Console, copie o erro completo
   - Compartilhe o erro

3. **Se ainda não funcionar:**
   - Verifique se está usando HTTPS/credenciais corretas
   - Verifique se o Supabase project está ativo (não pausado)

## Estrutura da Tabela Bills
```sql
CREATE TABLE public.bills (
  id uuid primary key,
  type bill_type not null,           -- 'pagar' ou 'receber'
  amount numeric(12, 2) not null,    -- Valor
  description text not null,          -- Descrição
  due_date date not null,             -- Vencimento (DATE, não timestamptz!)
  status bill_status default 'pendente',
  paid_date date,                     -- Data de pagamento
  paid_amount numeric(12, 2),         -- Valor pago
  account account_type,               -- Conta debitada/creditada
  created_by uuid not null,           -- Usuário que criou
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Teste Manual no Supabase SQL Editor

```sql
-- Teste de INSERT direto (para verificar se a tabela funciona)
INSERT INTO public.bills 
  (id, type, description, amount, status, due_date, created_by)
VALUES 
  (gen_random_uuid(), 'pagar', 'Teste', 100.00, 'pendente', '2025-11-12', auth.uid());

-- Ver se foi inserido
SELECT * FROM public.bills ORDER BY created_at DESC LIMIT 1;
```

Se este INSERT funcionar mas o da aplicação não, o problema é na RLS policy ou na autenticação.
