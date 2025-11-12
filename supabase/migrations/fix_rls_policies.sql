-- Adicionar política para usuários criarem seu próprio perfil durante signup
create policy "Usuários podem criar seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Função para criar perfil automaticamente quando um usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (email) do nothing;
  
  return new;
end;
$$;

-- Trigger para criar perfil automaticamente no registro
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Adicionar política para novos usuários atualizarem seu próprio perfil
create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Política para inserir roles do próprio usuário
create policy "Usuários podem inserir suas próprias roles"
  on public.user_roles for insert
  with check (auth.uid() = user_id);

-- Política para atualizar suas próprias roles (se necessário)
create policy "Usuários podem atualizar suas próprias roles"
  on public.user_roles for update
  using (auth.uid() = user_id);
