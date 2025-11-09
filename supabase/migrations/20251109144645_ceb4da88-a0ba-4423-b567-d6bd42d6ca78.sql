-- Criar enum para roles
create type public.app_role as enum ('admin', 'user');

-- Criar enum para tipos de pagamento
create type public.payment_method as enum ('dinheiro', 'pix', 'credito', 'debito');

-- Criar enum para bandeiras de cartão
create type public.card_brand as enum ('visa_master', 'elo_amex');

-- Criar enum para tipos de conta
create type public.account_type as enum ('caixa_dinheiro', 'caixa_pix', 'investimento', 'quitacao_dividas', 'reserva_folha');

-- Criar enum para categorias de transação
create type public.transaction_category as enum ('ALOCACAO_20', 'ALOCACAO_10', 'RESERVA_130', 'LIQUIDACAO_CARTAO', 'DESPESA', 'VENDA', 'AJUSTE');

-- Criar enum para status de contas
create type public.bill_status as enum ('pendente', 'pago', 'vencido');

-- Criar enum para tipo de bill
create type public.bill_type as enum ('pagar', 'receber');

-- Criar enum para tipo de pending
create type public.pending_type as enum ('allocation_20', 'allocation_10', 'reserve_130');

-- Tabela de perfis de usuários
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Tabela de roles (separada por segurança)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Função de segurança para verificar role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Tabela de contas financeiras
create table public.accounts (
  id account_type primary key,
  name text not null,
  balance numeric(12, 2) default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.accounts enable row level security;

-- Tabela de vendas
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  amount numeric(12, 2) not null,
  payment_method payment_method not null,
  card_brand card_brand,
  description text,
  liquidated boolean default false,
  liquidation_date timestamptz,
  net_amount numeric(12, 2),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.sales enable row level security;

-- Tabela de despesas
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  amount numeric(12, 2) not null,
  category text not null,
  payment_method payment_method not null,
  description text not null,
  account account_type not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.expenses enable row level security;

-- Tabela de contas a pagar/receber
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  type bill_type not null,
  amount numeric(12, 2) not null,
  description text not null,
  due_date date not null,
  status bill_status default 'pendente' not null,
  category text,
  counterparty text,
  paid_date date,
  account account_type,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.bills enable row level security;

-- Tabela de liquidações de cartão
create table public.card_liquidations (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade not null,
  sale_date timestamptz not null,
  sale_amount numeric(12, 2) not null,
  card_brand card_brand not null,
  payment_method payment_method not null,
  tax_rate numeric(5, 4) not null,
  tax_amount numeric(12, 2) not null,
  net_amount numeric(12, 2) not null,
  liquidation_date date not null,
  liquidated boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.card_liquidations enable row level security;

-- Tabela de transações internas
create table public.internal_transactions (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  from_account account_type not null,
  to_account account_type not null,
  amount numeric(12, 2) not null,
  category transaction_category not null,
  description text not null,
  reference text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.internal_transactions enable row level security;

-- Tabela de pendências
create table public.pendings (
  id uuid primary key default gen_random_uuid(),
  type pending_type not null,
  amount numeric(12, 2) not null,
  date timestamptz not null,
  description text not null,
  created_at timestamptz default now() not null
);

alter table public.pendings enable row level security;

-- RLS Policies para profiles
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins podem ver todos os perfis"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem inserir perfis"
  on public.profiles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem atualizar perfis"
  on public.profiles for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem deletar perfis"
  on public.profiles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para user_roles
create policy "Usuários podem ver suas próprias roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins podem ver todas as roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem inserir roles"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem deletar roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para accounts (apenas admins)
create policy "Admins podem ver contas"
  on public.accounts for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar contas"
  on public.accounts for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem atualizar contas"
  on public.accounts for update
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para sales (apenas admins)
create policy "Admins podem ver vendas"
  on public.sales for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar vendas"
  on public.sales for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para expenses (apenas admins)
create policy "Admins podem ver despesas"
  on public.expenses for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar despesas"
  on public.expenses for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para bills (apenas admins)
create policy "Admins podem ver contas"
  on public.bills for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar contas"
  on public.bills for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem atualizar contas"
  on public.bills for update
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para card_liquidations (apenas admins)
create policy "Admins podem ver liquidações"
  on public.card_liquidations for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar liquidações"
  on public.card_liquidations for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para internal_transactions (apenas admins)
create policy "Admins podem ver transações"
  on public.internal_transactions for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar transações"
  on public.internal_transactions for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para pendings (apenas admins)
create policy "Admins podem ver pendências"
  on public.pendings for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins podem criar pendências"
  on public.pendings for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.accounts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.bills
  for each row execute function public.handle_updated_at();

-- Inserir contas padrão do sistema
insert into public.accounts (id, name, balance) values
  ('caixa_dinheiro', 'Caixa Dinheiro', 0),
  ('caixa_pix', 'Caixa PIX', 0),
  ('investimento', 'Investimento (20%)', 0),
  ('quitacao_dividas', 'Quitação de Dívidas (10%)', 0),
  ('reserva_folha', 'Reserva Folha (R$ 130/dia)', 0);