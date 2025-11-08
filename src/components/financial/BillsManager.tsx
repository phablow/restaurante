import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AccountType } from '@/types/financial';

export const BillsManager = () => {
  const { bills, addBill, updateBill } = useFinancial();
  const [type, setType] = useState<'pagar' | 'receber'>('pagar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payAccount, setPayAccount] = useState<AccountType>('caixa_pix');

  const handleAddBill = () => {
    if (!amount || !description || !dueDate) {
      toast.error('Preencha todos os campos');
      return;
    }

    addBill({
      type,
      amount: parseFloat(amount),
      description,
      dueDate,
      status: 'pendente',
    });

    toast.success('Conta adicionada!');
    setAmount('');
    setDescription('');
    setDueDate('');
  };

  const handlePayBill = (billId: string) => {
    updateBill(billId, {
      status: 'pago',
      paidDate: new Date().toISOString().split('T')[0],
      account: payAccount,
    });
    toast.success('Conta paga/recebida!');
  };

  const getStatusBadge = (bill: typeof bills[0]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(bill.dueDate);
    due.setHours(0, 0, 0, 0);

    if (bill.status === 'pago') {
      return <Badge variant="default">Pago</Badge>;
    }
    if (due < today) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contas a Pagar/Receber</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">Nova Conta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Conta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as 'pagar' | 'receber')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagar">Conta a Pagar</SelectItem>
                      <SelectItem value="receber">Conta a Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddBill} className="w-full">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma conta cadastrada
                </TableCell>
              </TableRow>
            ) : (
              bills.map(bill => (
                <TableRow key={bill.id}>
                  <TableCell className="capitalize">{bill.type}</TableCell>
                  <TableCell>{bill.description}</TableCell>
                  <TableCell>R$ {bill.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(bill.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{getStatusBadge(bill)}</TableCell>
                  <TableCell>
                    {bill.status === 'pendente' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            {bill.type === 'pagar' ? 'Pagar' : 'Receber'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Pagamento/Recebimento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Conta</Label>
                              <Select value={payAccount} onValueChange={(v) => setPayAccount(v as AccountType)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="caixa_dinheiro">Caixa Dinheiro</SelectItem>
                                  <SelectItem value="caixa_pix">Caixa PIX</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={() => handlePayBill(bill.id)} className="w-full">
                              Confirmar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
