import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AccountType } from '@/types/financial';
import { Trash2, Settings, Calendar } from 'lucide-react';

export const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const { sales, expenses, bills, deleteSale, deleteExpense, deleteBill, setInitialBalance, accounts } = useFinancial();
  
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('caixa_dinheiro');
  const [initialBalance, setInitialBalanceValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'sale' | 'expense' | 'bill'; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feriados, setFeriados] = useState<Array<{ data: string; nome: string }>>([]);
  const [novoFeriado, setNovoFeriado] = useState('');
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('');
  const [feriadoToDelete, setFeriadoToDelete] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Painel de Administração</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Apenas administradores podem acessar este painel.</p>
        </CardContent>
      </Card>
    );
  }

  const loadFeriados = async () => {
    try {
      const { data, error } = await supabase
        .from('feriados' as any)
        .select('data, nome')
        .order('data');
      
      if (!error && data) {
        setFeriados(data.map((f: any) => ({ data: f.data, nome: f.nome })));
      }
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
    }
  };

  const handleAddFeriado = async () => {
    if (!novoFeriado || !novoFeriadoNome) {
      toast.error('Informe a data e nome do feriado');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('feriados' as any)
        .insert({ data: novoFeriado, nome: novoFeriadoNome, tipo: 'customizado' });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('Esse feriado já existe');
        } else {
          toast.error('Erro ao adicionar feriado');
        }
      } else {
        toast.success('Feriado adicionado');
        setNovoFeriado('');
        setNovoFeriadoNome('');
        await loadFeriados();
      }
    } catch (error) {
      toast.error('Erro ao adicionar feriado');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFeriado = async (data: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('feriados' as any)
        .delete()
        .eq('data', data);

      if (error) {
        toast.error('Erro ao deletar feriado');
      } else {
        toast.success('Feriado removido');
        setFeriadoToDelete(null);
        await loadFeriados();
      }
    } catch (error) {
      toast.error('Erro ao deletar feriado');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetInitialBalance = async () => {
    if (!initialBalance || parseFloat(initialBalance) < 0) {
      toast.error('Informe um saldo válido');
      return;
    }

    setIsLoading(true);
    try {
      await setInitialBalance(selectedAccount, parseFloat(initialBalance));
      toast.success(`Saldo inicial definido: R$ ${parseFloat(initialBalance).toFixed(2)}`);
      setInitialBalanceValue('');
    } catch (error) {
      toast.error('Erro ao definir saldo inicial');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteSale(id);
      toast.success('Venda deletada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao deletar venda');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteExpense(id);
      toast.success('Despesa deletada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao deletar despesa');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteBill(id);
      toast.success('Conta deletada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao deletar conta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Saldo Inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurar Saldo Inicial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label htmlFor="initial-balance">Saldo Inicial (R$)</Label>
              <Input
                id="initial-balance"
                type="number"
                step="0.01"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalanceValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleSetInitialBalance}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Definindo...' : 'Definir Saldo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Feriados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Gerenciar Feriados
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Feriados determinam quando as liquidações de cartão são processadas (D+1 pula fins de semana e feriados)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar novo feriado */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="feriado-date">Data (YYYY-MM-DD)</Label>
              <Input
                id="feriado-date"
                type="date"
                value={novoFeriado}
                onChange={(e) => setNovoFeriado(e.target.value)}
                placeholder="2025-11-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feriado-nome">Nome do Feriado</Label>
              <Input
                id="feriado-nome"
                type="text"
                value={novoFeriadoNome}
                onChange={(e) => setNovoFeriadoNome(e.target.value)}
                placeholder="Ex: Consciência Negra"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAddFeriado}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Feriado'}
              </Button>
            </div>
          </div>

          {/* Lista de feriados */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Feriados Cadastrados</h3>
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feriados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nenhum feriado cadastrado. Clique em "Carregar Feriados" para visualizar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    feriados.map(feriado => (
                      <TableRow key={feriado.data}>
                        <TableCell>{feriado.data}</TableCell>
                        <TableCell>{feriado.nome}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setFeriadoToDelete(feriado.data)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Button 
              onClick={loadFeriados}
              variant="outline"
              className="mt-4 w-full"
            >
              Carregar Feriados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deletar Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma venda registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>R$ {sale.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                      <TableCell>{sale.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm({ type: 'sale', id: sale.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deletar Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma despesa registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm({ type: 'expense', id: expense.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deletar Contas a Pagar/Receber */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar/Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma conta registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map(bill => (
                    <TableRow key={bill.id}>
                      <TableCell className="capitalize">{bill.type}</TableCell>
                      <TableCell>{bill.description}</TableCell>
                      <TableCell>R$ {bill.amount.toFixed(2)}</TableCell>
                      <TableCell>{bill.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={bill.status === 'pago' ? 'default' : 'secondary'}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm({ type: 'bill', id: bill.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === 'sale') {
                  handleDeleteSale(deleteConfirm.id);
                } else if (deleteConfirm.type === 'expense') {
                  handleDeleteExpense(deleteConfirm.id);
                } else {
                  handleDeleteBill(deleteConfirm.id);
                }
              }}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação de Exclusão de Feriado */}
      <AlertDialog open={!!feriadoToDelete} onOpenChange={() => setFeriadoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Feriado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este feriado? Futuras liquidações não mais o considerarão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (feriadoToDelete) {
                  handleDeleteFeriado(feriadoToDelete);
                }
              }}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
