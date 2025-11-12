# Recursos de Administração

## Visão Geral

Foram implementadas novas funcionalidades de administração que permitem gerenciamento completo de lançamentos e configurações de contas. Todas estas funcionalidades estão **restritas apenas a usuários administradores**.

## Painel de Administração

Acesse a aba **"Admin"** no sistema para gerenciar:

### 1. Configurar Saldo Inicial

Permite definir o saldo inicial para qualquer conta.

**Como usar:**
1. Selecione a conta desejada (Caixa Dinheiro, Caixa PIX, etc.)
2. Informe o saldo inicial em R$
3. Clique em "Definir Saldo"
4. O sistema registrará automaticamente um lançamento do tipo "AJUSTE"

**Contas disponíveis:**
- Caixa Dinheiro
- Caixa PIX
- Investimento
- Quitação Dívidas
- Reserva Folha

### 2. Deletar Vendas

Permite remover vendas registradas.

**Comportamento:**
- Quando uma venda é deletada, o sistema automaticamente **reverte o saldo da conta**
- Se foi paga em dinheiro, o saldo de "Caixa Dinheiro" é reduzido
- Se foi paga em PIX, o saldo de "Caixa PIX" é reduzido
- A venda é removida permanentemente do banco de dados

**Confirmação:**
- Um diálogo de confirmação aparecerá antes de deletar
- A ação não pode ser desfeita

### 3. Deletar Despesas

Permite remover despesas registradas.

**Comportamento:**
- Quando uma despesa é deletada, o sistema:
  1. **Reverte o saldo da conta** (dinheiro ou PIX)
  2. Remove a transação interna associada
  3. Remove a despesa permanentemente

**Confirmação:**
- Um diálogo de confirmação aparecerá antes de deletar
- A ação não pode ser desfeita

### 4. Deletar Contas a Pagar/Receber

Permite remover contas (faturas).

**Comportamento:**
- A conta é removida permanentemente do banco de dados
- O saldo não é revertido automaticamente (pois contas a pagar/receber não afetam saldo direto)

**Confirmação:**
- Um diálogo de confirmação aparecerá antes de deletar
- A ação não pode ser desfeita

## Alterações na Interface de Lançamentos

### Formulários em Modal

Os formulários de lançamentos foram convertidos para **modais (pop-ups)** melhorando a UX:

#### SalesForm (Registrar Venda)
- **Antes:** Formulário expandido na tela
- **Agora:** Botão "Nova Venda" abre modal
- **Auto-close:** Modal fecha automaticamente após registro bem-sucedido
- **Nova Receita:** Botão "Nova Venda" reaparece para facilitar lançamentos contínuos

#### ExpenseForm (Registrar Despesa)
- **Antes:** Formulário expandido na tela
- **Agora:** Botão "Nova Despesa" abre modal
- **Auto-close:** Modal fecha automaticamente após registro bem-sucedido
- **Nova Despesa:** Botão "Nova Despesa" reaparece para facilitar lançamentos contínuos

#### BillsManager (Contas a Pagar/Receber)
- **Antes:** Botão "Nova Conta" abria modal sem auto-close
- **Agora:** Modal fecha automaticamente após adição
- **Pagamentos:** Modal de pagamento também agora fecha após sucesso
- **Nova Conta:** Botão "Nova Conta" reaparece para facilitar cadastros contínuos

## Fluxo de Uso Recomendado

### Registrar Múltiplas Vendas
1. Clique em "Nova Venda"
2. Preencha os dados
3. Sistema valida e salva no Supabase
4. Modal fecha automaticamente
5. Sistema exibe "Venda registrada com sucesso!"
6. Botão "Nova Venda" reaparece - pronto para o próximo lançamento

### Deletar um Lançamento
1. Acesse aba "Admin"
2. Localize o lançamento na tabela
3. Clique no ícone de lixeira (🗑️)
4. Confirme a exclusão no diálogo
5. Sistema reverte saldos automaticamente
6. Lançamento é removido da tabela

## Segurança e Restrições

✅ **Admin-only Features:**
- Todas as funcionalidades de admin requerem que o usuário seja administrador
- Se um usuário não-admin tentar acessar a aba "Admin", verá mensagem: "Apenas administradores podem acessar este painel"

✅ **Validações:**
- Confirmação obrigatória antes de deletar qualquer lançamento
- Validação de valores (não permite valores negativos ou zeros)
- Validação de campos obrigatórios

✅ **Rastreamento:**
- Todas as operações incluem validação de sessão do usuário
- Lançamentos de "AJUSTE" (saldo inicial) ficam registrados no extrato
- Deletions são permanentes mas o histórico pode ser recuperado do banco de dados

## Dados Técnicos

### Tipos de Transações Internas
- `VENDA` - Receita de vendas
- `DESPESA` - Saída de despesas
- `AJUSTE` - Ajuste de saldo inicial
- `CONTA_PAGAR` - Pagamento de conta
- `CONTA_RECEBER` - Recebimento de conta

### Contas do Sistema
- `caixa_dinheiro` - Caixa em dinheiro
- `caixa_pix` - Caixa em PIX
- `investimento` - Aplicação/Investimento (20% das vendas)
- `quitacao_dividas` - Fundo para quitação de dívidas
- `reserva_folha` - Reserva para folha de pagamento

## Próximas Melhorias (Roadmap)

- [ ] Auditoria completa de deleções (log quem e quando deletou)
- [ ] Soft delete com restauração possível
- [ ] Permissões granulares (ex: admin com restrições)
- [ ] Backup automático antes de operações críticas
- [ ] Relatório de alterações de saldo

## Suporte

Se encontrar problemas:
1. Verifique se é administrador
2. Confirme que a sessão está ativa
3. Verifique o console para mensagens de erro
4. Contate o desenvolvedor com print da erro
