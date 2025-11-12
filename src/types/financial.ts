// Tipos do sistema financeiro

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';
export type CardBrand = 'visa_master' | 'elo_amex';
export type AccountType = 'caixa_dinheiro' | 'caixa_pix' | 'investimento' | 'quitacao_dividas' | 'reserva_folha';
export type TransactionCategory = 'ALOCACAO_20' | 'ALOCACAO_10' | 'RESERVA_130' | 'LIQUIDACAO_CARTAO' | 'DESPESA' | 'VENDA' | 'AJUSTE';
export type BillStatus = 'pendente' | 'pago' | 'vencido';

export interface Sale {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardBrand?: CardBrand;
  description?: string;
  saleType?: string;
  liquidated?: boolean;
  liquidationDate?: string;
  netAmount?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  account: AccountType;
}

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
}

export interface InternalTransaction {
  id: string;
  date: string;
  fromAccount: AccountType;
  toAccount: AccountType;
  amount: number;
  category: TransactionCategory;
  description: string;
  reference?: string;
}

export interface Pending {
  id: string;
  type: 'allocation_20' | 'allocation_10' | 'reserve_130';
  amount: number;
  date: string;
  description: string;
}

export interface Bill {
  id: string;
  type: 'pagar' | 'receber';
  amount: number;
  description: string;
  dueDate: string;
  status: BillStatus;
  category?: string;
  counterparty?: string;
  paidDate?: string;
  account?: AccountType;
  paidAmount?: number;
}

export interface CardLiquidation {
  id: string;
  saleId: string;
  saleDate: string;
  saleAmount: number;
  cardBrand: CardBrand;
  paymentMethod: 'credito' | 'debito';
  taxRate: number;
  taxAmount: number;
  netAmount: number;
  liquidationDate: string;
  liquidated: boolean;
}

export const CARD_TAX_RATES = {
  credito: {
    visa_master: 0.0315,
    elo_amex: 0.0491,
  },
  debito: {
    visa_master: 0.0137,
    elo_amex: 0.0258,
  },
} as const;

export const ALLOCATION_PERCENTAGES = {
  investment: 0.20,
  debtPayment: 0.10,
} as const;

export const DAILY_RESERVE_AMOUNT = 130;
