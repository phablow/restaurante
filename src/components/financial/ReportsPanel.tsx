import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancial } from '@/contexts/FinancialContext';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Função para converter data string sem timezone
const parseDateString = (dateStr: string): Date => {
  // Esperado: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:MM:SS.sssZ"
  const datePart = dateStr.split('T')[0]; // Extrai "YYYY-MM-DD"
  const [year, month, day] = datePart.split('-').map(Number);
  // Cria Date usando construtor que NÃO interpreta timezone
  return new Date(year, month - 1, day);
};

// Gerar lista dos últimos 12 meses
const getMonthOptions = () => {
  const today = new Date();
  const months = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = format(date, 'MMMM yyyy', { locale: ptBR });
    months.push({ value, label });
  }
  
  return months;
};

export const ReportsPanel = () => {
  const { bills, sales, expenses, getAccountBalance } = useFinancial();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Contas a pagar (pendentes)
  const contasAPagar = bills.filter(
    (bill) => bill.type === 'pagar' && bill.status === 'pendente'
  );

  // Contas a receber (pendentes)
  const contasAReceber = bills.filter(
    (bill) => bill.type === 'receber' && bill.status === 'pendente'
  );

  // Total de contas a pagar
  const totalAPagar = contasAPagar.reduce((sum, bill) => sum + bill.amount, 0);

  // Total de contas a receber
  const totalAReceber = contasAReceber.reduce((sum, bill) => sum + bill.amount, 0);

  // Filtrar vendas pelo mês selecionado
  const [year, month] = selectedMonth.split('-').map(Number);
  const vendasMesAtual = sales.filter((sale) => {
    const saleDate = parseDateString(sale.date);
    return saleDate.getMonth() === month - 1 && saleDate.getFullYear() === year;
  });

  const totalVendasMes = vendasMesAtual.reduce((sum, sale) => sum + sale.amount, 0);

  // Filtrar despesas pelo mês selecionado
  const despesasMesAtual = expenses.filter((expense) => {
    const expenseDate = parseDateString(expense.date);
    return expenseDate.getMonth() === month - 1 && expenseDate.getFullYear() === year;
  });

  const totalDespesasMes = despesasMesAtual.reduce((sum, expense) => sum + expense.amount, 0);

  const getStatusBadge = (bill: typeof bills[0]) => {
    if (bill.status === 'pago') {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500">Pago</Badge>;
    }

    if (bill.status === 'vencido') {
      return <Badge variant="destructive">Vencido</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {totalAPagar.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasAPagar.length} conta(s) pendente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalAReceber.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasAReceber.length} conta(s) pendente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalVendasMes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {vendasMesAtual.length} venda(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              R$ {totalDespesasMes.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesasMesAtual.length} despesa(s) registrada(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas detalhadas */}
      <Tabs defaultValue="pagar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="pagar">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                Lista de todas as contas pendentes de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasAPagar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma conta a pagar
                      </TableCell>
                    </TableRow>
                  ) : (
                    contasAPagar.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>
                          {format(parseDateString(bill.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>R$ {bill.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(bill)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receber">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                Lista de todas as contas pendentes de recebimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasAReceber.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma conta a receber
                      </TableCell>
                    </TableRow>
                  ) : (
                    contasAReceber.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>
                          {format(parseDateString(bill.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>R$ {bill.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(bill)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendas</CardTitle>
                <CardDescription>
                  Todas as vendas registradas no mês selecionado
                </CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasMesAtual.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma venda registrada neste mês
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendasMesAtual.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {format(parseDateString(sale.date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                        <TableCell>R$ {sale.amount.toFixed(2)}</TableCell>
                        <TableCell>{sale.description || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
              <CardDescription>
                Todas as despesas registradas no mês selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesasMesAtual.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma despesa registrada neste mês
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesasMesAtual.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(parseDateString(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="capitalize">{expense.account}</TableCell>
                        <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
