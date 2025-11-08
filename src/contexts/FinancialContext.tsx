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

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'caixa_dinheiro', name: 'Caixa Dinheiro', balance: 0 },
  { id: 'caixa_pix', name: 'Caixa PIX (InfinitePay)', balance: 0 },
  { id: 'investimento', name: 'Investimento (20%)', balance: 0 },
  { id: 'quitacao_dividas', name: 'Quitação de Dívidas (10%)', balance: 0 },
  { id: 'reserva_folha', name: 'Reserva de Folha', balance: 0 },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const stored = localStorage.getItem('accounts');
    return stored ? JSON.parse(stored) : INITIAL_ACCOUNTS;
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const stored = localStorage.getItem('sales');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem('expenses');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [transactions, setTransactions] = useState<InternalTransaction[]>(() => {
    const stored = localStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [pendings, setPendings] = useState<Pending[]>(() => {
    const stored = localStorage.getItem('pendings');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [bills, setBills] = useState<Bill[]>(() => {
    const stored = localStorage.getItem('bills');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [cardLiquidations, setCardLiquidations] = useState<CardLiquidation[]>(() => {
    const stored = localStorage.getItem('cardLiquidations');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pendings', JSON.stringify(pendings));
  }, [pendings]);

  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('cardLiquidations', JSON.stringify(cardLiquidations));
  }, [cardLiquidations]);

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
