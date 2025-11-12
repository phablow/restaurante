# 🧪 Guia de Testes - Novas Funcionalidades

## 📌 Pré-requisitos
- ✅ Estar logado como usuário admin
- ✅ Ter Supabase conectado
- ✅ Ter executado a migração `add_paid_amount_column.sql`

---

## 🎮 Testes Funcionais

### Teste 1️⃣: Acessar Painel de Admin

**Objetivo:** Verificar se acesso ao Admin funciona

**Passos:**
1. Faça login no sistema
2. Procure pela aba **"Admin"** nas abas principais
3. Você deve ver:
   - Seção "Configurar Saldo Inicial"
   - Tabela "Vendas Registradas"
   - Tabela "Despesas Registradas"
   - Tabela "Contas a Pagar/Receber"

**Resultado Esperado:** ✅ Painel completo com todas as seções

**Se Falhar:**
- [ ] Verificar se usuário é admin (verifique em "Usuários")
- [ ] Recarregar página (F5)
- [ ] Limpar cache do navegador

---

### Teste 2️⃣: Configurar Saldo Inicial

**Objetivo:** Testar configuração de saldo inicial para uma conta

**Passos:**
1. Acesse aba **"Admin"**
2. Na seção "Configurar Saldo Inicial":
   - Selecione conta: **"Caixa Dinheiro"**
   - Informe valor: **R$ 500,00**
   - Clique em **"Definir Saldo"**
3. Você deve ver mensagem: "Saldo inicial definido: R$ 500.00"
4. Acesse aba **"Relatórios"** ou **"Extratos"**
5. Procure por transação tipo **"AJUSTE"** com valor 500

**Resultado Esperado:** ✅ Lançamento AJUSTE registrado no extrato

**Se Falhar:**
- [ ] Verificar valor informado (deve ser positivo)
- [ ] Verificar console (F12) para erro
- [ ] Verificar conexão com Supabase

---

### Teste 3️⃣: Registrar Venda via Modal

**Objetivo:** Testar novo fluxo de modal auto-fechável para vendas

**Passos:**
1. Na aba **"Lançamentos"** (ou similar)
2. Localize cartão "Registrar Venda"
3. Clique em botão **"Nova Venda"**
4. Deve abrir um **modal/popup** com formulário
5. Preencha dados:
   - Data: hoje
   - Tipo: "Marmita"
   - Valor: R$ 30,00
   - Meio de Pagamento: "Dinheiro"
   - Descrição: "Teste Modal"
6. Clique em **"Registrar Venda"**

**Comportamento Esperado:**
- ✅ Mensagem "Venda registrada com sucesso!"
- ✅ Modal fecha automaticamente (em 1-2 segundos)
- ✅ Cartão exibe "Venda registrada com sucesso!" com botão "Nova Venda"
- ✅ Pode-se clicar em "Nova Venda" imediatamente para novo lançamento

**Se Modal não Fechar:**
- [ ] Verificar console (F12)
- [ ] Tentar recarregar página
- [ ] Verificar navegador (usar Chrome se possível)

---

### Teste 4️⃣: Registrar Despesa via Modal

**Objetivo:** Testar novo fluxo de modal auto-fechável para despesas

**Passos:**
1. Na aba **"Lançamentos"**
2. Localize cartão "Registrar Despesa"
3. Clique em botão **"Nova Despesa"**
4. Deve abrir um **modal/popup** com formulário
5. Preencha dados:
   - Valor: R$ 100,00
   - Categoria: "Fornecedores"
   - Pagar com: "Caixa PIX"
   - Descrição: "Teste Despesa"
6. Clique em **"Registrar Despesa"**

**Comportamento Esperado:**
- ✅ Mensagem "Despesa registrada com sucesso!"
- ✅ Modal fecha automaticamente
- ✅ Cartão exibe "Despesa registrada com sucesso!" com botão "Nova Despesa"
- ✅ Saldo de "Caixa PIX" reduzido em R$ 100

---

### Teste 5️⃣: Deletar Venda (Admin)

**Objetivo:** Testar deleção de venda com reversão de saldo

**Passos:**
1. **Pré-requisito:** Registre uma venda de teste (ex: R$ 50 em dinheiro)
2. Anote o saldo de "Caixa Dinheiro" **ANTES**
3. Acesse aba **"Admin"**
4. Na tabela "Vendas Registradas", localize a venda criada
5. Clique no ícone de **lixeira** 🗑️
6. Deve aparecer diálogo com:
   - "Confirmar Exclusão"
   - "Tem certeza que deseja deletar este lançamento?"
7. Clique em **"Deletar"**

**Comportamento Esperado:**
- ✅ Mensagem "Venda deletada"
- ✅ Venda desaparece da tabela
- ✅ Saldo de "Caixa Dinheiro" aumenta novamente (reverté)
- ✅ Se foi em PIX, aumenta "Caixa PIX"

**Dados de Teste:**
- Venda de R$ 50 em dinheiro
  - Saldo antes: R$ 500
  - Após deletar: R$ 450 → R$ 500 (revertido)

---

### Teste 6️⃣: Deletar Despesa (Admin)

**Objetivo:** Testar deleção de despesa com reversão de saldo

**Passos:**
1. **Pré-requisito:** Registre uma despesa de teste (ex: R$ 75 em PIX)
2. Anote o saldo de "Caixa PIX" **ANTES**
3. Acesse aba **"Admin"**
4. Na tabela "Despesas Registradas", localize a despesa criada
5. Clique no ícone de **lixeira** 🗑️
6. Confirme a deleção

**Comportamento Esperado:**
- ✅ Mensagem "Despesa deletada"
- ✅ Despesa desaparece da tabela
- ✅ Saldo de "Caixa PIX" aumenta novamente (reverté)
- ✅ Transação interna associada também é deletada

---

### Teste 7️⃣: Adicionar Conta a Pagar com Modal Auto-Close

**Objetivo:** Testar novo fluxo modal para contas com auto-close

**Passos:**
1. Acesse aba **"Contas"**
2. Clique em botão **"Nova Conta"**
3. Modal abre com formulário
4. Preencha:
   - Tipo: "Conta a Pagar"
   - Valor: R$ 200,00
   - Descrição: "Teste Modal Conta"
   - Vencimento: data futura
5. Clique em **"Adicionar"**

**Comportamento Esperado:**
- ✅ Mensagem "Conta adicionada!"
- ✅ Modal fecha automaticamente
- ✅ Cartão exibe mensagem de sucesso com botão "Nova Conta"
- ✅ Nova conta aparece na tabela com status "Pendente"

---

### Teste 8️⃣: Pagamento Parcial com Auto-Close

**Objetivo:** Testar pagamento parcial e auto-close do modal

**Passos:**
1. **Pré-requisito:** Registre uma conta a receber de R$ 300
2. Acesse aba **"Contas"**
3. Na conta criada, clique no botão **"Receber"**
4. Modal abre, preencha:
   - Data: hoje
   - Marque checkbox "Pagamento/Recebimento Parcial"
   - Valor a Receber: R$ 100 (parcial)
   - Conta: "Caixa PIX"
5. Clique em **"Confirmar"**

**Comportamento Esperado:**
- ✅ Mensagem "Recebimento parcial de R$ 100.00 registrado!"
- ✅ Modal fecha automaticamente
- ✅ Conta permanece "Pendente" (pois não foi paga totalmente)
- ✅ Valor restante: R$ 200
- ✅ Saldo de "Caixa PIX" aumenta R$ 100

---

## 🔐 Testes de Segurança

### Teste 9️⃣: Acesso Negado (Não-Admin)

**Objetivo:** Verificar restrição de acesso para não-admins

**Passos:**
1. **Mudar para usuário não-admin:**
   - Acesse "Gerenciar Usuários" (como admin)
   - Crie novo usuário SEM permissão admin
   - Faça logout
   - Faça login como novo usuário
2. Tente acessar aba **"Admin"**

**Resultado Esperado:**
- ✅ Mensagem: "Apenas administradores podem acessar este painel"
- ✅ Tabelas não aparecem
- ✅ Sem acesso aos botões de deletar

---

### Teste 🔟: Confirmação de Segurança

**Objetivo:** Verificar diálogo de confirmação antes de deletar

**Passos:**
1. Acesse aba **"Admin"**
2. Clique em botão de lixeira de qualquer item
3. Verifique que aparece **AlertDialog** com:
   - Título: "Confirmar Exclusão"
   - Mensagem explicativa
   - Botões: "Cancelar" e "Deletar"
4. Clique em **"Cancelar"**
   - Item NÃO deve ser deletado
5. Repita e clique em **"Deletar"**
   - Item DEVE ser deletado

**Resultado Esperado:** ✅ Diálogo obrigatório funciona corretamente

---

## 📊 Testes de Dados

### Teste 1️⃣1️⃣: Verificar Integridade de Saldos

**Objetivo:** Confirmar que reversão de saldos funciona corretamente

**Passos:**
1. Registre venda: R$ 50 em dinheiro
2. Anote saldo de "Caixa Dinheiro": ex: R$ 500
3. Venda criada, saldo agora: R$ 550
4. Acesse Admin e delete a venda
5. Saldo volta para: R$ 500

**Verificação:**
- ✅ Cálculo correto
- ✅ Sem duplicação
- ✅ Sem erros matemáticos

---

### Teste 1️⃣2️⃣: Verificar Transações AJUSTE

**Objetivo:** Confirmar que saldos iniciais registram corretamente

**Passos:**
1. Defina saldo inicial de R$ 1000 para "Investimento"
2. Acesse aba **"Extratos"**
3. Procure por transação tipo **"AJUSTE"**

**Verificação:**
- ✅ Transação aparece no extrato
- ✅ Valor correto (1000)
- ✅ Tipo correto (AJUSTE)
- ✅ Conta correta (Investimento)
- ✅ Data correta (hoje)

---

## ✅ Checklist de Testes

### Funcionalidades
- [ ] Teste 1: Painel Admin acessível
- [ ] Teste 2: Saldo inicial configurável
- [ ] Teste 3: Venda via modal + auto-close
- [ ] Teste 4: Despesa via modal + auto-close
- [ ] Teste 5: Deletar venda + reversão
- [ ] Teste 6: Deletar despesa + reversão
- [ ] Teste 7: Conta modal + auto-close
- [ ] Teste 8: Pagamento parcial

### Segurança
- [ ] Teste 9: Acesso restrito a admin
- [ ] Teste 10: Confirmação obrigatória

### Dados
- [ ] Teste 11: Integridade de saldos
- [ ] Teste 12: Transações AJUSTE

---

## 🐛 Troubleshooting

### Modal não fecha automaticamente
**Solução:**
- [ ] Limpar cache: Ctrl+Shift+Delete
- [ ] Recarregar página: F5
- [ ] Usar navegador moderno (Chrome/Firefox)
- [ ] Verificar console: F12 → Console

### Erro ao deletar
**Solução:**
- [ ] Verificar se é admin
- [ ] Verificar conexão Supabase
- [ ] Recarregar página
- [ ] Verificar mensagem de erro no console

### Saldo não reverte
**Solução:**
- [ ] Verificar se deletar foi bem-sucedido
- [ ] Verificar saldo antes/depois
- [ ] Recarregar página para atualizar
- [ ] Contatar desenvolvedor se persistir

---

## 📞 Reportar Problemas

Se encontrar bug, forneça:
1. **Passos para reproduzir**
2. **Resultado esperado vs. atual**
3. **Print da tela**
4. **Mensagem de erro (console F12)**
5. **Seu navegador e versão**

---

**Última Atualização:** [data atual]
**Versão:** 1.0.0
**Status:** ✅ Pronto para produção
