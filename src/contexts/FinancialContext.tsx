import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Sale,
  Expense,
  Account,
  InternalTransaction,
  Pending,
  Bill,
  CardLiquidation,
  AccountType,
  PaymentMethod,
  CARD_TAX_RATES,
  ALLOCATION_PERCENTAGES,
  DAILY_RESERVE_AMOUNT,
} from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { extractDateOnly, addDaysToDateString, getTodayString, isWeekend, getNextBusinessDay, getNextBusinessDaySkipHolidays } from '@/lib/dateUtils';

/**
 * IMPORTANTE: Todas as datas são armazenadas como strings no formato YYYY-MM-DD
 * sem informação de timezone. Isso foi configurado no Supabase para evitar
 * problemas de interpretação incorreta de timezone.
 * 
 * O PostgreSQL armazena datas locais sem conversão, garantindo que:
 * - Uma venda registrada em 12/11/2025 sempre será 12/11/2025
 * - Não há conversão automática baseada em timezone
 * - Funciona corretamente independente do horário de verão
 * 
 * As funções de utilidade para datas estão em @/lib/dateUtils.ts
 */

interface FinancialContextType {
  accounts: Account[];
  sales: Sale[];
  expenses: Expense[];
  transactions: InternalTransaction[];
  pendings: Pending[];
  bills: Bill[];
  cardLiquidations: CardLiquidation[];
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  setInitialBalance: (accountId: AccountType, initialBalance: number) => Promise<void>;
  executeEndOfDay: (date: string) => Promise<void>;
  processLiquidations: (date: string) => Promise<void>;
  compensatePendings: () => void;
  getAccountBalance: (accountId: AccountType) => number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<InternalTransaction[]>([]);
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [cardLiquidations, setCardLiquidations] = useState<CardLiquidation[]>([]);
  const [feriados, setFeriados] = useState<string[]>([]); // Armazena datas de feriados como "YYYY-MM-DD"

  // Carregar dados do Supabase
  useEffect(() => {
    if (session) {
      loadAccounts();
      loadSales();
      loadExpenses();
      loadTransactions();
      loadPendings();
      loadBills();
      loadCardLiquidations();
      loadFeriados();
    }
  }, [session]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at');
    
    if (data) {
      setAccounts(data.map(acc => ({
        id: acc.id as AccountType,
        name: acc.name,
        balance: Number(acc.balance),
      })));
    }
  };

  const loadSales = async () => {
    const { data } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) {
      setSales(data.map(s => ({
        id: s.id,
        date: extractDateOnly(s.date),
        amount: Number(s.amount),
        paymentMethod: s.payment_method as PaymentMethod,
        cardBrand: s.card_brand as any,
        description: s.description || '',
        netAmount: s.net_amount ? Number(s.net_amount) : undefined,
        liquidated: s.liquidated || false,
        liquidationDate: s.liquidation_date ? extractDateOnly(s.liquidation_date) : undefined,
      })));
    }
  };

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) {
      setExpenses(data.map(e => ({
        id: e.id,
        date: extractDateOnly(e.date),
        amount: Number(e.amount),
        paymentMethod: e.payment_method as PaymentMethod,
        account: e.account as AccountType,
        category: e.category,
        description: e.description,
      })));
    }
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('internal_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) {
      setTransactions(data.map(t => ({
        id: t.id,
        date: extractDateOnly(t.date),
        fromAccount: t.from_account as AccountType,
        toAccount: t.to_account as AccountType,
        amount: Number(t.amount),
        category: t.category as any,
        description: t.description,
        reference: t.reference || undefined,
      })));
    }
  };

  const loadPendings = async () => {
    const { data } = await supabase
      .from('pendings')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) {
      setPendings(data.map(p => ({
        id: p.id,
        type: p.type as any,
        amount: Number(p.amount),
        date: extractDateOnly(p.date),
        description: p.description,
      })));
    }
  };

  const loadBills = async () => {
    const { data } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (data) {
      setBills(data.map((b: any) => ({
        id: b.id,
        type: b.type as any,
        description: b.description,
        amount: Number(b.amount),
        dueDate: extractDateOnly(b.due_date),
        status: b.status as any,
        counterparty: b.counterparty || undefined,
        category: b.category || undefined,
        account: b.account as AccountType || undefined,
        paidDate: b.paid_date ? extractDateOnly(b.paid_date) : undefined,
        paidAmount: b.paid_amount ? Number(b.paid_amount) : undefined,
      })));
    }
  };

  const loadCardLiquidations = async () => {
    const { data } = await supabase
      .from('card_liquidations')
      .select('*')
      .order('liquidation_date', { ascending: false });
    
    if (data) {
      setCardLiquidations(data.map(l => ({
        id: l.id,
        saleId: l.sale_id,
        saleDate: extractDateOnly(l.sale_date),
        saleAmount: Number(l.sale_amount),
        cardBrand: l.card_brand as any,
        paymentMethod: l.payment_method as 'credito' | 'debito',
        taxRate: Number(l.tax_rate),
        taxAmount: Number(l.tax_amount),
        netAmount: Number(l.net_amount),
        liquidationDate: extractDateOnly(l.liquidation_date),
        liquidated: l.liquidated,
      })));
    }
  };

  const loadFeriados = async () => {
    try {
      // Tentar carregar feriados do banco de dados
      const { data, error } = await supabase
        .from('feriados' as any) // Cast temporário até atualizar tipos
        .select('data')
        .order('data');
      
      if (!error && data) {
        setFeriados(data.map((f: any) => extractDateOnly(f.data)));
      } else {
        // Se tabela não existe ainda, usar feriados padrão para 2025
        setFeriados([
          '2025-01-01', // Ano Novo
          '2025-02-19', // Sexta-feira de Carnaval
          '2025-02-20', // Sábado de Carnaval
          '2025-02-21', // Domingo de Carnaval
          '2025-02-22', // Segunda de Carnaval
          '2025-02-24', // Segunda de Páscoa
          '2025-04-21', // Tiradentes
          '2025-05-01', // Dia do Trabalho
          '2025-05-30', // Corpus Christi
          '2025-09-07', // Independência do Brasil
          '2025-10-12', // Nossa Senhora Aparecida
          '2025-11-02', // Finados
          '2025-11-20', // Consciência Negra
          '2025-12-25', // Natal
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
      // Usar feriados padrão em caso de erro
      setFeriados([
        '2025-01-01', '2025-02-19', '2025-02-20', '2025-02-21', '2025-02-22',
        '2025-02-24', '2025-04-21', '2025-05-01', '2025-05-30', '2025-09-07',
        '2025-10-12', '2025-11-02', '2025-11-20', '2025-12-25',
      ]);
    }
  };

  const isFeriado = async (dateString: string): Promise<boolean> => {
    return feriados.includes(dateString);
  };

  const calculateLiquidationDate = async (saleDate: string): Promise<string> => {
    // Começa com D+1
    let liquidationDate = addDaysToDateString(saleDate, 1);
    
    // Pula fins de semana e feriados
    let attempts = 0;
    while (attempts < 30) {
      // Verificar se é fim de semana
      if (isWeekend(liquidationDate)) {
        liquidationDate = addDaysToDateString(liquidationDate, 1);
        attempts++;
        continue;
      }
      
      // Verificar se é feriado
      if (feriados.includes(liquidationDate)) {
        liquidationDate = addDaysToDateString(liquidationDate, 1);
        attempts++;
        continue;
      }
      
      // Data válida encontrada
      break;
    }
    
    return liquidationDate;
  };

  const updateAccountBalance = async (accountId: AccountType, delta: number) => {
    // Atualizar localmente primeiro
    const currentAccount = accounts.find(acc => acc.id === accountId);
    if (!currentAccount) return;
    
    const newBalance = currentAccount.balance + delta;
    
    // Atualizar estado local
    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: newBalance } : acc))
    );
    
    // Persistir no Supabase
    await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);
  };

  const addTransaction = async (transaction: Omit<InternalTransaction, 'id'>) => {
    if (!session?.user.id) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    
    // Atualizar estado local
    setTransactions(prev => [...prev, newTransaction]);
    
    // Persistir no Supabase
    await supabase
      .from('internal_transactions')
      .insert({
        id: newTransaction.id,
        date: newTransaction.date,
        from_account: newTransaction.fromAccount,
        to_account: newTransaction.toAccount,
        amount: newTransaction.amount,
        category: newTransaction.category,
        description: newTransaction.description,
        reference: newTransaction.reference || null,
        created_by: session.user.id,
      });
  };

  const addPending = async (pending: Omit<Pending, 'id'>) => {
    const newPending = { ...pending, id: crypto.randomUUID() };
    
    // Atualizar estado local
    setPendings(prev => [...prev, newPending]);
    
    // Persistir no Supabase
    await supabase
      .from('pendings')
      .insert({
        id: newPending.id,
        type: newPending.type,
        amount: newPending.amount,
        date: newPending.date,
        description: newPending.description,
      });
  };

  const getAccountBalance = (accountId: AccountType): number => {
    return accounts.find(acc => acc.id === accountId)?.balance || 0;
  };

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    if (!session?.user.id) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    const newSale: Sale = { ...sale, id: crypto.randomUUID() };
    
    // Salvar no Supabase
    const { error } = await supabase
      .from('sales')
      .insert({
        id: newSale.id,
        date: newSale.date,
        amount: newSale.amount,
        payment_method: newSale.paymentMethod,
        card_brand: newSale.cardBrand || null,
        description: newSale.description || null,
        created_by: session.user.id,
        sale_type: (newSale as any).saleType || 'outros',
      });
    
    if (!error) {
      // Atualizar saldo imediatamente para dinheiro e PIX
      if (sale.paymentMethod === 'dinheiro') {
        await updateAccountBalance('caixa_dinheiro', sale.amount);
      } else if (sale.paymentMethod === 'pix') {
        await updateAccountBalance('caixa_pix', sale.amount);
      } else if (sale.paymentMethod === 'credito' || sale.paymentMethod === 'debito') {
        // Para cartões, criar liquidação D+1 (pulando fins de semana e feriados)
        if (sale.cardBrand) {
          const taxRate = CARD_TAX_RATES[sale.paymentMethod][sale.cardBrand];
          const taxAmount = sale.amount * taxRate;
          const netAmount = sale.amount - taxAmount;
          
          // Calcular data de liquidação (próximo dia útil, pulando fins de semana e feriados)
          const liquidationDate = await calculateLiquidationDate(sale.date);
          
          const newLiquidation: CardLiquidation = {
            id: crypto.randomUUID(),
            saleId: newSale.id,
            saleDate: sale.date,
            saleAmount: sale.amount,
            cardBrand: sale.cardBrand,
            paymentMethod: sale.paymentMethod,
            taxRate,
            taxAmount,
            netAmount,
            liquidationDate,
            liquidated: false,
          };
          
          setCardLiquidations(prev => [...prev, newLiquidation]);
          newSale.netAmount = netAmount;
          
          // Salvar liquidação no Supabase
          await supabase
            .from('card_liquidations')
            .insert({
              id: newLiquidation.id,
              sale_id: newLiquidation.saleId,
              sale_date: newLiquidation.saleDate,
              sale_amount: newLiquidation.saleAmount,
              card_brand: newLiquidation.cardBrand,
              payment_method: newLiquidation.paymentMethod,
              tax_rate: newLiquidation.taxRate,
              tax_amount: newLiquidation.taxAmount,
              net_amount: newLiquidation.netAmount,
              liquidation_date: newLiquidation.liquidationDate,
              liquidated: newLiquidation.liquidated,
            });
        }
      }
      
      setSales(prev => [...prev, newSale]);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!session?.user.id) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    const newExpense = { ...expense, id: crypto.randomUUID() };
    
    // Salvar no Supabase
    const { error } = await supabase
      .from('expenses')
      .insert({
        id: newExpense.id,
        date: newExpense.date,
        amount: newExpense.amount,
        category: newExpense.category,
        payment_method: newExpense.paymentMethod,
        description: newExpense.description,
        account: newExpense.account,
        created_by: session.user.id,
      });
    
    if (!error) {
      // Debitar da conta selecionada
      await updateAccountBalance(expense.account, -expense.amount);
      
      await addTransaction({
        date: expense.date,
        fromAccount: expense.account,
        toAccount: expense.account, // Despesa não tem destino
        amount: expense.amount,
        category: 'DESPESA',
        description: `Despesa: ${expense.description}`,
        reference: newExpense.id,
      });
      
      setExpenses(prev => [...prev, newExpense]);
    }
  };

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    if (!session?.user.id) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    const newBill = { ...bill, id: crypto.randomUUID() };
    
    // Persistir no Supabase PRIMEIRO
    const { error } = await supabase
      .from('bills')
      .insert({
        id: newBill.id,
        type: newBill.type,
        description: newBill.description,
        amount: newBill.amount,
        status: newBill.status,
        due_date: newBill.dueDate,
        paid_date: newBill.paidDate || null,
        paid_amount: newBill.paidAmount || null,
        account: newBill.account || null,
        created_by: session.user.id,
      });

    // Só atualizar estado LOCAL se foi salvo com sucesso
    if (!error) {
      setBills(prev => [...prev, newBill]);
    } else {
      throw new Error(`Erro ao salvar conta: ${error.message}`);
    }
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    setBills(prev =>
      prev.map(b => {
        if (b.id === id) {
          const updated = { ...b, ...updates };
          
          // Se está sendo pago/recebido com pagamento parcial
          if (updates.paidAmount !== undefined && updates.account) {
            const amountToTransfer = updates.paidAmount;
            if (bill.type === 'pagar') {
              updateAccountBalance(updates.account, -amountToTransfer);
            } else {
              updateAccountBalance(updates.account, amountToTransfer);
            }
          }
          
          return updated;
        }
        return b;
      })
    );

    // Persistir no Supabase
    const updateData: any = {
      status: updates.status,
      paid_date: updates.paidDate,
      account: updates.account,
    };

    if (updates.paidAmount !== undefined) {
      updateData.paid_amount = updates.paidAmount;
      updateData.amount = updates.amount; // Saldo restante
    }

    if (updates.status === 'pago' && updates.account) {
      const amountToTransfer = updates.paidAmount || bill.amount;
      if (bill.type === 'pagar') {
        await updateAccountBalance(updates.account, -amountToTransfer);
      } else {
        await updateAccountBalance(updates.account, amountToTransfer);
      }
    }

    await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id);
  };

  const executeEndOfDay = async (date: string) => {
    // Calcular base do dia (vendas brutas + contas a receber do dia)
    const dailySales = sales.filter(s => s.date === date);
    const dailySalesAmount = dailySales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Contas a receber confirmadas do dia
    const dailyBillsReceived = bills.filter(
      b => b.type === 'receber' && b.dueDate === date && b.status === 'pago'
    );
    const dailyBillsAmount = dailyBillsReceived.reduce((sum, bill) => sum + bill.amount, 0);
    
    // Liquidações do dia anterior que chegaram hoje (já consideradas como receita)
    const yesterdayFormatted = addDaysToDateString(date, -1);
    
    const yesterdayLiquidations = cardLiquidations.filter(
      liq => liq.liquidationDate === date && liq.saleDate === yesterdayFormatted && !liq.liquidated
    );
    const yesterdayLiquidationsAmount = yesterdayLiquidations.reduce((sum, liq) => sum + liq.netAmount, 0);
    
    // RECEITA TOTAL = vendas brutas + contas a receber + liquidações (que já estão no PIX)
    const totalRevenue = dailySalesAmount + dailyBillsAmount + yesterdayLiquidationsAmount;
    
    if (totalRevenue === 0) return;
    
    // Calcular percentuais sobre TODA receita que entrou no dia
    const allocation20 = totalRevenue * ALLOCATION_PERCENTAGES.investment;
    const allocation10 = totalRevenue * ALLOCATION_PERCENTAGES.debtPayment;
    const reserve130 = DAILY_RESERVE_AMOUNT;
    
    // Alocação 20% para investimento (a partir do caixa_pix)
    const pixBalance = getAccountBalance('caixa_pix');
    
    if (pixBalance >= allocation20) {
      await updateAccountBalance('caixa_pix', -allocation20);
      await updateAccountBalance('investimento', allocation20);
      await addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'investimento',
        amount: allocation20,
        category: 'ALOCACAO_20',
        description: `Alocação 20% sobre receita total de R$ ${totalRevenue.toFixed(2)}`,
      });
    } else if (pixBalance > 0) {
      // Transferir o que tem disponível e criar pendência
      await updateAccountBalance('caixa_pix', -pixBalance);
      await updateAccountBalance('investimento', pixBalance);
      await addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'investimento',
        amount: pixBalance,
        category: 'ALOCACAO_20',
        description: `Alocação parcial 20% (pendência: R$ ${(allocation20 - pixBalance).toFixed(2)})`,
      });
      
      const pendingAmount = allocation20 - pixBalance;
      await addPending({
        type: 'allocation_20',
        amount: pendingAmount,
        date,
        description: `Pendência alocação 20% investimento`,
      });
    }
    
    // Alocação 10% para quitação de dívidas
    const pixBalanceAfter20 = getAccountBalance('caixa_pix');
    
    if (pixBalanceAfter20 >= allocation10) {
      await updateAccountBalance('caixa_pix', -allocation10);
      await updateAccountBalance('quitacao_dividas', allocation10);
      await addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'quitacao_dividas',
        amount: allocation10,
        category: 'ALOCACAO_10',
        description: `Alocação 10% sobre receita total de R$ ${totalRevenue.toFixed(2)}`,
      });
    } else if (pixBalanceAfter20 > 0) {
      await updateAccountBalance('caixa_pix', -pixBalanceAfter20);
      await updateAccountBalance('quitacao_dividas', pixBalanceAfter20);
      await addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'quitacao_dividas',
        amount: pixBalanceAfter20,
        category: 'ALOCACAO_10',
        description: `Alocação parcial 10% (pendência: R$ ${(allocation10 - pixBalanceAfter20).toFixed(2)})`,
      });
      
      const pendingAmount = allocation10 - pixBalanceAfter20;
      await addPending({
        type: 'allocation_10',
        amount: pendingAmount,
        date,
        description: `Pendência alocação 10% quitação dívidas`,
      });
    }
    
    // Reservar R$ 130 do caixa dinheiro para folha de pagamento
    const dinheiroBalance = getAccountBalance('caixa_dinheiro');
    
    if (dinheiroBalance >= reserve130) {
      await updateAccountBalance('caixa_dinheiro', -reserve130);
      await updateAccountBalance('reserva_folha', reserve130);
      await addTransaction({
        date,
        fromAccount: 'caixa_dinheiro',
        toAccount: 'reserva_folha',
        amount: reserve130,
        category: 'RESERVA_130',
        description: `Reserva diária para folha de pagamento (R$ 130)`,
      });
    } else if (dinheiroBalance > 0) {
      await updateAccountBalance('caixa_dinheiro', -dinheiroBalance);
      await updateAccountBalance('reserva_folha', dinheiroBalance);
      await addTransaction({
        date,
        fromAccount: 'caixa_dinheiro',
        toAccount: 'reserva_folha',
        amount: dinheiroBalance,
        category: 'RESERVA_130',
        description: `Reserva parcial (pendência: R$ ${(reserve130 - dinheiroBalance).toFixed(2)})`,
      });
      
      const pendingAmount = reserve130 - dinheiroBalance;
      await addPending({
        type: 'reserve_130',
        amount: pendingAmount,
        date,
        description: `Pendência reserva folha`,
      });
    }
  };

  const processLiquidations = async (date: string) => {
    // Buscar liquidações do dia anterior que chegam hoje
    const yesterdayFormatted = addDaysToDateString(date, -1);
    
    const toLiquidate = cardLiquidations.filter(
      liq => liq.liquidationDate === date && liq.saleDate === yesterdayFormatted && !liq.liquidated
    );
    
    if (toLiquidate.length === 0) return;
    
    for (const liq of toLiquidate) {
      // Adicionar VALOR BRUTO ao caixa_pix (não o valor líquido)
      const grossAmount = liq.netAmount + liq.taxAmount;
      await updateAccountBalance('caixa_pix', grossAmount);
      
      // Registrar a transação de liquidação
      await addTransaction({
        date,
        fromAccount: 'caixa_pix', // Recebimento no caixa_pix
        toAccount: 'caixa_pix',
        amount: grossAmount,
        category: 'LIQUIDACAO_CARTAO',
        description: `Liquidação cartão ${liq.cardBrand} - Venda de ${liq.saleDate}`,
        reference: liq.saleId,
      });
      
      // Criar despesa automática com o valor da taxa
      const taxExpense: Omit<Expense, 'id'> = {
        date,
        amount: liq.taxAmount,
        category: 'LIQUIDACAO_CARTAO',
        paymentMethod: liq.paymentMethod,
        account: 'caixa_pix',
        description: `Taxa liquidação ${liq.cardBrand} - Venda de ${liq.saleDate}`,
      };
      
      addExpense(taxExpense);
      
      // Marcar venda como liquidada
      setSales(prev =>
        prev.map(s => (s.id === liq.saleId ? { ...s, liquidated: true, liquidationDate: date } : s))
      );
    }
    
    // Marcar liquidações como processadas
    setCardLiquidations(prev =>
      prev.map(liq => (toLiquidate.includes(liq) ? { ...liq, liquidated: true } : liq))
    );
  };

  const compensatePendings = () => {
    const sortedPendings = [...pendings].sort((a, b) => {
      const priority = { allocation_20: 1, allocation_10: 2, reserve_130: 3 };
      return priority[a.type] - priority[b.type];
    });
    
    sortedPendings.forEach(pending => {
      if (pending.type === 'allocation_20' || pending.type === 'allocation_10') {
        const pixBalance = getAccountBalance('caixa_pix');
        const toAccount = pending.type === 'allocation_20' ? 'investimento' : 'quitacao_dividas';
        
        if (pixBalance >= pending.amount) {
          updateAccountBalance('caixa_pix', -pending.amount);
          updateAccountBalance(toAccount, pending.amount);
          addTransaction({
            date: getTodayString(),
            fromAccount: 'caixa_pix',
            toAccount,
            amount: pending.amount,
            category: pending.type === 'allocation_20' ? 'ALOCACAO_20' : 'ALOCACAO_10',
            description: `Compensação de pendência - ${pending.description}`,
          });
          
          setPendings(prev => prev.filter(p => p.id !== pending.id));
        }
      } else if (pending.type === 'reserve_130') {
        const dinheiroBalance = getAccountBalance('caixa_dinheiro');
        
        if (dinheiroBalance >= pending.amount) {
          updateAccountBalance('caixa_dinheiro', -pending.amount);
          updateAccountBalance('reserva_folha', pending.amount);
          addTransaction({
            date: getTodayString(),
            fromAccount: 'caixa_dinheiro',
            toAccount: 'reserva_folha',
            amount: pending.amount,
            category: 'RESERVA_130',
            description: `Compensação de pendência - ${pending.description}`,
          });
          
          setPendings(prev => prev.filter(p => p.id !== pending.id));
        }
      }
    });
  };

  const deleteSale = async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    // Reverter saldo
    if (sale.paymentMethod === 'dinheiro') {
      await updateAccountBalance('caixa_dinheiro', -sale.amount);
    } else if (sale.paymentMethod === 'pix') {
      await updateAccountBalance('caixa_pix', -sale.amount);
    } else if (sale.paymentMethod === 'credito' || sale.paymentMethod === 'debito') {
      // Se for cartão, reverter a liquidação também
      const liquidation = cardLiquidations.find(l => l.saleId === id);
      if (liquidation) {
        // Deletar liquidação do Supabase
        await supabase.from('card_liquidations').delete().eq('id', liquidation.id);
        // Atualizar estado
        setCardLiquidations(prev => prev.filter(l => l.id !== liquidation.id));
      }
    }

    // Deletar do Supabase
    await supabase.from('sales').delete().eq('id', id);

    // Atualizar estado local
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const deleteExpense = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // Reverter saldo
    await updateAccountBalance(expense.account, expense.amount);

    // Deletar transação associada
    await supabase
      .from('internal_transactions')
      .delete()
      .eq('reference', id);

    // Deletar do Supabase
    await supabase.from('expenses').delete().eq('id', id);

    // Atualizar estado local
    setExpenses(prev => prev.filter(e => e.id !== id));
    setTransactions(prev => prev.filter(t => t.reference !== id));
  };

  const deleteBill = async (id: string) => {
    // Deletar do Supabase
    await supabase.from('bills').delete().eq('id', id);

    // Atualizar estado local
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const setInitialBalance = async (accountId: AccountType, initialBalance: number) => {
    // Atualizar no Supabase
    await supabase
      .from('accounts')
      .update({ balance: initialBalance })
      .eq('id', accountId);

    // Atualizar estado local
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === accountId ? { ...acc, balance: initialBalance } : acc
      )
    );

    // Registrar como transação de ajuste
    await addTransaction({
      date: getTodayString(),
      fromAccount: accountId,
      toAccount: accountId,
      amount: initialBalance,
      category: 'AJUSTE',
      description: `Saldo inicial: R$ ${initialBalance.toFixed(2)}`,
    });
  };

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        sales,
        expenses,
        transactions,
        pendings,
        bills,
        cardLiquidations,
        addSale,
        addExpense,
        addBill,
        updateBill,
        deleteSale,
        deleteExpense,
        deleteBill,
        setInitialBalance,
        executeEndOfDay,
        processLiquidations,
        compensatePendings,
        getAccountBalance,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within FinancialProvider');
  }
  return context;
};
