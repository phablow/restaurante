import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountType } from '@/types/financial';

// Função para converter data string para Date sem timezone
const parseDateString = (dateStr: string): Date => {
  const datePart = dateStr.split('T')[0]; // Extrai "YYYY-MM-DD"
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const StatementPanel = () => {
  const { sales, expenses, transactions, accounts } = useFinancial();
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('caixa_dinheiro');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Construir extrato consolidado
  const buildStatement = () => {
    const statement: any[] = [];

    // Adicionar vendas
    sales.forEach(sale => {
      if (
        (sale.paymentMethod === 'dinheiro' && selectedAccount === 'caixa_dinheiro') ||
        (sale.paymentMethod === 'pix' && selectedAccount === 'caixa_pix')
      ) {
        statement.push({
          date: sale.date,
          type: 'VENDA',
          description: `Venda - ${sale.saleType || 'outros'} (${sale.paymentMethod})`,
          amount: sale.amount,
          operation: 'entrada',
          id: `sale-${sale.id}`,
        });
      }
    });

    // Adicionar despesas
    expenses.forEach(expense => {
      if (expense.account === selectedAccount) {
        statement.push({
          date: expense.date,
          type: 'DESPESA',
          description: `Despesa: ${expense.description}`,
          amount: expense.amount,
          operation: 'saída',
          id: `expense-${expense.id}`,
        });
      }
    });

    // Adicionar transações internas (EXCETO DESPESA que já está em expenses)
    transactions.forEach(trans => {
      // Pular se for transação de DESPESA (já está em expenses)
      if (trans.category === 'DESPESA') {
        return;
      }

      if (trans.fromAccount === selectedAccount) {
        statement.push({
          date: trans.date,
          type: trans.category,
          description: `${trans.category}: ${trans.description}`,
          amount: trans.amount,
          operation: 'saída',
          id: `trans-from-${trans.id}`,
        });
      }
      if (trans.toAccount === selectedAccount && trans.fromAccount !== selectedAccount) {
        statement.push({
          date: trans.date,
          type: trans.category,
          description: `${trans.category}: ${trans.description}`,
          amount: trans.amount,
          operation: 'entrada',
          id: `trans-to-${trans.id}`,
        });
      }
    });

    // Filtrar por data se fornecidas
    let filtered = statement;
    if (startDate) {
      filtered = filtered.filter(item => item.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(item => item.date <= endDate);
    }

    // Ordenar por data
    filtered.sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

    return filtered;
  };

  const statement = buildStatement();

  // Calcular saldos ao longo do tempo
  let runningBalance = 0;
  const statementWithBalance = statement.map(item => {
    if (item.operation === 'entrada') {
      runningBalance += item.amount;
    } else {
      runningBalance -= item.amount;
    }
    return {
      ...item,
      balance: runningBalance,
    };
  });

  const currentAccount = accounts.find(a => a.id === selectedAccount);
  const accountName = currentAccount?.name || selectedAccount;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VENDA':
        return 'bg-green-100 text-green-800';
      case 'DESPESA':
        return 'bg-red-100 text-red-800';
      case 'ALOCACAO_20':
        return 'bg-blue-100 text-blue-800';
      case 'ALOCACAO_10':
        return 'bg-blue-100 text-blue-800';
      case 'RESERVA_130':
        return 'bg-purple-100 text-purple-800';
      case 'LIQUIDACAO_CARTAO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extrato - {accountName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-select">Conta</Label>
            <Select value={selectedAccount} onValueChange={(v) => setSelectedAccount(v as AccountType)}>
              <SelectTrigger id="account-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="caixa_dinheiro">Caixa Dinheiro</SelectItem>
                <SelectItem value="caixa_pix">Caixa PIX</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="quitacao_dividas">Quitação Dívidas</SelectItem>
                <SelectItem value="reserva_folha">Reserva Folha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className="text-2xl font-bold">
                R$ {currentAccount?.balance.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Entradas</p>
              <p className="text-xl font-semibold text-green-600">
                R$ {statement
                  .filter(s => s.operation === 'entrada')
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Saídas</p>
              <p className="text-xl font-semibold text-red-600">
                R$ {statement
                  .filter(s => s.operation === 'saída')
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Saída</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statementWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Nenhuma movimentação registrada para este período
                  </TableCell>
                </TableRow>
              ) : (
                statementWithBalance.map((item, idx) => (
                  <TableRow key={item.id || idx} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {parseDateString(item.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.operation === 'entrada' ? (
                        <span className="text-green-600 font-semibold">
                          +R$ {item.amount.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.operation === 'saída' ? (
                        <span className="text-red-600 font-semibold">
                          -R$ {item.amount.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {item.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            <strong>Total de Movimentações:</strong> {statement.length}
          </p>
          <p>
              <strong>Período:</strong> {startDate ? parseDateString(startDate).toLocaleDateString('pt-BR') : 'Sem filtro'} a{' '}
              {endDate ? parseDateString(endDate).toLocaleDateString('pt-BR') : 'Sem filtro'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
