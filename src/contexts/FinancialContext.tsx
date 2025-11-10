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

interface FinancialContextType {
  accounts: Account[];
  sales: Sale[];
  expenses: Expense[];
  transactions: InternalTransaction[];
  pendings: Pending[];
  bills: Bill[];
  cardLiquidations: CardLiquidation[];
  addSale: (sale: Omit<Sale, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  executeEndOfDay: (date: string) => void;
  processLiquidations: (date: string) => void;
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
        date: s.date,
        amount: Number(s.amount),
        paymentMethod: s.payment_method as PaymentMethod,
        cardBrand: s.card_brand as any,
        description: s.description || '',
        netAmount: s.net_amount ? Number(s.net_amount) : undefined,
        liquidated: s.liquidated || false,
        liquidationDate: s.liquidation_date || undefined,
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
        date: e.date,
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
        date: t.date,
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
        date: p.date,
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
      setBills(data.map(b => ({
        id: b.id,
        type: b.type as any,
        description: b.description,
        amount: Number(b.amount),
        dueDate: b.due_date,
        status: b.status as any,
        counterparty: b.counterparty || undefined,
        category: b.category || undefined,
        account: b.account as AccountType || undefined,
        paidDate: b.paid_date || undefined,
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
        saleDate: l.sale_date,
        saleAmount: Number(l.sale_amount),
        cardBrand: l.card_brand as any,
        paymentMethod: l.payment_method as 'credito' | 'debito',
        taxRate: Number(l.tax_rate),
        taxAmount: Number(l.tax_amount),
        netAmount: Number(l.net_amount),
        liquidationDate: l.liquidation_date,
        liquidated: l.liquidated,
      })));
    }
  };

  const updateAccountBalance = (accountId: AccountType, delta: number) => {
    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: acc.balance + delta } : acc))
    );
  };

  const addTransaction = (transaction: Omit<InternalTransaction, 'id'>) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const getAccountBalance = (accountId: AccountType): number => {
    return accounts.find(acc => acc.id === accountId)?.balance || 0;
  };

  const addSale = (sale: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...sale, id: crypto.randomUUID() };
    
    // Atualizar saldo imediatamente para dinheiro e PIX
    if (sale.paymentMethod === 'dinheiro') {
      updateAccountBalance('caixa_dinheiro', sale.amount);
    } else if (sale.paymentMethod === 'pix') {
      updateAccountBalance('caixa_pix', sale.amount);
    } else if (sale.paymentMethod === 'credito' || sale.paymentMethod === 'debito') {
      // Para cartões, criar liquidação D+1
      if (sale.cardBrand) {
        const taxRate = CARD_TAX_RATES[sale.paymentMethod][sale.cardBrand];
        const taxAmount = sale.amount * taxRate;
        const netAmount = sale.amount - taxAmount;
        
        const liquidationDate = new Date(sale.date);
        liquidationDate.setDate(liquidationDate.getDate() + 1);
        
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
          liquidationDate: liquidationDate.toISOString().split('T')[0],
          liquidated: false,
        };
        
        setCardLiquidations(prev => [...prev, newLiquidation]);
        newSale.netAmount = netAmount;
      }
    }
    
    setSales(prev => [...prev, newSale]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    
    // Debitar da conta selecionada
    updateAccountBalance(expense.account, -expense.amount);
    
    addTransaction({
      date: expense.date,
      fromAccount: expense.account,
      toAccount: expense.account, // Despesa não tem destino
      amount: expense.amount,
      category: 'DESPESA',
      description: `Despesa: ${expense.description}`,
      reference: newExpense.id,
    });
    
    setExpenses(prev => [...prev, newExpense]);
  };

  const addBill = (bill: Omit<Bill, 'id'>) => {
    const newBill = { ...bill, id: crypto.randomUUID() };
    setBills(prev => [...prev, newBill]);
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setBills(prev =>
      prev.map(bill => {
        if (bill.id === id) {
          const updated = { ...bill, ...updates };
          
          // Se está sendo pago/recebido
          if (updates.status === 'pago' && updates.account) {
            if (bill.type === 'pagar') {
              updateAccountBalance(updates.account, -bill.amount);
            } else {
              updateAccountBalance(updates.account, bill.amount);
            }
          }
          
          return updated;
        }
        return bill;
      })
    );
  };

  const executeEndOfDay = (date: string) => {
    // Calcular base do dia (todas as vendas brutas)
    const dailySales = sales.filter(s => s.date === date);
    const dailyBase = dailySales.reduce((sum, sale) => sum + sale.amount, 0);
    
    if (dailyBase === 0) return;
    
    const allocation20 = dailyBase * ALLOCATION_PERCENTAGES.investment;
    const allocation10 = dailyBase * ALLOCATION_PERCENTAGES.debtPayment;
    
    const pixBalance = getAccountBalance('caixa_pix');
    
    // Alocar 20% para investimento
    if (pixBalance >= allocation20) {
      updateAccountBalance('caixa_pix', -allocation20);
      updateAccountBalance('investimento', allocation20);
      addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'investimento',
        amount: allocation20,
        category: 'ALOCACAO_20',
        description: `Alocação 20% sobre base de R$ ${dailyBase.toFixed(2)}`,
      });
    } else {
      // Transferir parcial e criar pendência
      if (pixBalance > 0) {
        updateAccountBalance('caixa_pix', -pixBalance);
        updateAccountBalance('investimento', pixBalance);
        addTransaction({
          date,
          fromAccount: 'caixa_pix',
          toAccount: 'investimento',
          amount: pixBalance,
          category: 'ALOCACAO_20',
          description: `Alocação parcial 20% (pendência: R$ ${(allocation20 - pixBalance).toFixed(2)})`,
        });
      }
      
      const pendingAmount = allocation20 - pixBalance;
      if (pendingAmount > 0) {
        setPendings(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'allocation_20',
            amount: pendingAmount,
            date,
            description: `Pendência alocação 20% investimento`,
          },
        ]);
      }
    }
    
    // Alocar 10% para quitação de dívidas
    const pixBalanceAfter20 = getAccountBalance('caixa_pix');
    
    if (pixBalanceAfter20 >= allocation10) {
      updateAccountBalance('caixa_pix', -allocation10);
      updateAccountBalance('quitacao_dividas', allocation10);
      addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'quitacao_dividas',
        amount: allocation10,
        category: 'ALOCACAO_10',
        description: `Alocação 10% sobre base de R$ ${dailyBase.toFixed(2)}`,
      });
    } else {
      if (pixBalanceAfter20 > 0) {
        updateAccountBalance('caixa_pix', -pixBalanceAfter20);
        updateAccountBalance('quitacao_dividas', pixBalanceAfter20);
        addTransaction({
          date,
          fromAccount: 'caixa_pix',
          toAccount: 'quitacao_dividas',
          amount: pixBalanceAfter20,
          category: 'ALOCACAO_10',
          description: `Alocação parcial 10% (pendência: R$ ${(allocation10 - pixBalanceAfter20).toFixed(2)})`,
        });
      }
      
      const pendingAmount = allocation10 - pixBalanceAfter20;
      if (pendingAmount > 0) {
        setPendings(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'allocation_10',
            amount: pendingAmount,
            date,
            description: `Pendência alocação 10% quitação dívidas`,
          },
        ]);
      }
    }
    
    // Retirar R$ 130 do caixa dinheiro
    const dinheiroBalance = getAccountBalance('caixa_dinheiro');
    
    if (dinheiroBalance >= DAILY_RESERVE_AMOUNT) {
      updateAccountBalance('caixa_dinheiro', -DAILY_RESERVE_AMOUNT);
      updateAccountBalance('reserva_folha', DAILY_RESERVE_AMOUNT);
      addTransaction({
        date,
        fromAccount: 'caixa_dinheiro',
        toAccount: 'reserva_folha',
        amount: DAILY_RESERVE_AMOUNT,
        category: 'RESERVA_130',
        description: `Reserva diária para folha de pagamento`,
      });
    } else {
      if (dinheiroBalance > 0) {
        updateAccountBalance('caixa_dinheiro', -dinheiroBalance);
        updateAccountBalance('reserva_folha', dinheiroBalance);
        addTransaction({
          date,
          fromAccount: 'caixa_dinheiro',
          toAccount: 'reserva_folha',
          amount: dinheiroBalance,
          category: 'RESERVA_130',
          description: `Reserva parcial (pendência: R$ ${(DAILY_RESERVE_AMOUNT - dinheiroBalance).toFixed(2)})`,
        });
      }
      
      const pendingAmount = DAILY_RESERVE_AMOUNT - dinheiroBalance;
      if (pendingAmount > 0) {
        setPendings(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'reserve_130',
            amount: pendingAmount,
            date,
            description: `Pendência reserva folha`,
          },
        ]);
      }
    }
  };

  const processLiquidations = (date: string) => {
    const toLiquidate = cardLiquidations.filter(
      liq => liq.liquidationDate === date && !liq.liquidated
    );
    
    toLiquidate.forEach(liq => {
      updateAccountBalance('caixa_pix', liq.netAmount);
      
      addTransaction({
        date,
        fromAccount: 'caixa_pix',
        toAccount: 'caixa_pix',
        amount: liq.netAmount,
        category: 'LIQUIDACAO_CARTAO',
        description: `Liquidação cartão - Venda de ${liq.saleDate} (taxa: R$ ${liq.taxAmount.toFixed(2)})`,
        reference: liq.saleId,
      });
      
      setSales(prev =>
        prev.map(s => (s.id === liq.saleId ? { ...s, liquidated: true, liquidationDate: date } : s))
      );
    });
    
    setCardLiquidations(prev =>
      prev.map(liq => (toLiquidate.includes(liq) ? { ...liq, liquidated: true } : liq))
    );
    
    // Após liquidações, compensar pendências
    compensatePendings();
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
            date: new Date().toISOString().split('T')[0],
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
            date: new Date().toISOString().split('T')[0],
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
