-- Script para verificar e corrigir permissões de admin

-- 1. Ver qual é seu user_id
SELECT id, email FROM auth.users WHERE email LIKE '%@%' LIMIT 10;

-- 2. Verificar suas roles atuais (substitua SEU_USER_ID)
SELECT * FROM public.user_roles WHERE user_id = 'SEU_USER_ID';

-- 3. Se não houver nenhum admin, adicionar você como admin
-- (substitua SEU_USER_ID pelo ID que apareceu em (1))
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID', 'admin')
ON CONFLICT DO NOTHING;

-- 4. Verificar se foi inserido
SELECT * FROM public.user_roles WHERE user_id = 'SEU_USER_ID';

-- 5. Teste rápido - tente inserir uma conta
INSERT INTO public.bills 
  (id, type, description, amount, status, due_date, created_by)
VALUES 
  (gen_random_uuid(), 'pagar', 'Teste de permissão', 100.00, 'pendente', CURRENT_DATE, 'SEU_USER_ID');

-- 6. Ver se foi inserido
SELECT * FROM public.bills WHERE description = 'Teste de permissão';

-- 7. Se funcionou, deletar o teste
DELETE FROM public.bills WHERE description = 'Teste de permissão';
