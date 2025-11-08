import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';

export const Dashboard = () => {
  const { accounts, sales, expenses, bills, cardLiquidations } = useFinancial();

  const today = new Date().toISOString().split('T')[0];
  
  const todaySales = sales
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.amount, 0);
  
  const todayExpenses = expenses
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const pendingBills = bills.filter(b => b.status === 'pendente').length;
  
  const pendingLiquidations = cardLiquidations
    .filter(l => !l.liquidated)
    .reduce((sum, l) => sum + l.netAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Despesas: R$ {todayExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBills}</div>
            <p className="text-xs text-muted-foreground">Contas a pagar/receber</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidações Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {pendingLiquidations.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Cartões D+1</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa PIX</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {accounts.find(a => a.id === 'caixa_pix')?.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Disponível</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {accounts.map(account => (
          <Card key={account.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">R$ {account.balance.toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
