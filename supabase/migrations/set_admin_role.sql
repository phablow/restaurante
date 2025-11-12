-- Script para atribuir role de admin
-- IMPORTANTE: Substitua 'seu-email@restaurante.com' pelo seu email real

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
where email = 'seu-email@restaurante.com'
on conflict (user_id, role) do nothing;

-- Verificar se foi inserido corretamente
select u.email, ur.role 
from auth.users u
left join public.user_roles ur on u.id = ur.user_id
where u.email = 'seu-email@restaurante.com';
