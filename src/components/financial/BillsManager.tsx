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
import { Plus } from 'lucide-react';

// Função para converter data string para Date sem timezone
const parseDateString = (dateStr: string): Date => {
  const datePart = dateStr.split('T')[0]; // Extrai "YYYY-MM-DD"
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const BillsManager = () => {
  const { bills, addBill, updateBill } = useFinancial();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [type, setType] = useState<'pagar' | 'receber'>('pagar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payAccount, setPayAccount] = useState<AccountType>('caixa_pix');
  const [paidDate, setPaidDate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const resetAddForm = () => {
    setType('pagar');
    setAmount('');
    setDescription('');
    setDueDate('');
    setJustAdded(false);
  };

  const resetPayForm = () => {
    setPaidDate('');
    setPaidAmount('');
    setIsPartial(false);
    setSelectedBillForPayment(null);
  };

  const handleAddBill = async () => {
    if (!amount || !description || !dueDate) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      await addBill({
        type,
        amount: parseFloat(amount),
        description,
        dueDate,
        status: 'pendente',
      });

      toast.success('Conta adicionada!');
      setJustAdded(true);
      resetAddForm();
      
      // Fechar dialog e reabrir após 500ms
      setTimeout(() => {
        setAddDialogOpen(false);
        setTimeout(() => {
          setJustAdded(false);
        }, 300);
      }, 500);
    } catch (error) {
      toast.error('Erro ao adicionar conta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayBill = async (billId: string, billAmount: number) => {
    if (!paidDate) {
      toast.error('Selecione a data do pagamento/recebimento');
      return;
    }

    let amountToPay = billAmount;
    if (isPartial) {
      if (!paidAmount || parseFloat(paidAmount) <= 0) {
        toast.error('Informe o valor pago');
        return;
      }
      amountToPay = parseFloat(paidAmount);
      if (amountToPay > billAmount) {
        toast.error(`Valor pago não pode ser maior que R$ ${billAmount.toFixed(2)}`);
        return;
      }
    }

    const status = isPartial && amountToPay < billAmount ? 'pendente' : 'pago';
    
    try {
      await updateBill(billId, {
        status,
        paidDate: paidDate,
        account: payAccount,
        amount: isPartial ? (billAmount - amountToPay) : billAmount,
        paidAmount: amountToPay,
      });

      toast.success(
        isPartial && status === 'pendente'
          ? `Recebimento parcial de R$ ${amountToPay.toFixed(2)} registrado!`
          : 'Conta paga/recebida completamente!'
      );
      
      resetPayForm();
      setPayDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
      console.error(error);
    }
  };

  const getStatusBadge = (bill: typeof bills[0]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseDateString(bill.dueDate);
    due.setHours(0, 0, 0, 0);

    if (bill.status === 'pago') {
      return <Badge variant="default">Pago</Badge>;
    }
    if (due < today) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (justAdded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contas a Pagar/Receber</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Conta adicionada com sucesso!</p>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
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

                  <Button 
                    onClick={handleAddBill} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contas a Pagar/Receber</span>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
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

                <Button 
                  onClick={handleAddBill} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adicionando...' : 'Adicionar'}
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
              <TableHead>Valor Pago</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhuma conta cadastrada
                </TableCell>
              </TableRow>
            ) : (
              bills.map(bill => (
                <TableRow key={bill.id}>
                  <TableCell className="capitalize">{bill.type}</TableCell>
                  <TableCell>{bill.description}</TableCell>
                  <TableCell>R$ {bill.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {bill.paidAmount ? `R$ ${bill.paidAmount.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{parseDateString(bill.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{getStatusBadge(bill)}</TableCell>
                  <TableCell>
                    {bill.paidDate 
                      ? parseDateString(bill.paidDate).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {bill.status === 'pendente' && (
                      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedBillForPayment(bill.id);
                              setPaidAmount(bill.amount.toString());
                              setIsPartial(false);
                            }}
                          >
                            {bill.type === 'pagar' ? 'Pagar' : 'Receber'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {bill.type === 'pagar' ? 'Pagar' : 'Receber'} - {bill.description}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">Valor Total</p>
                              <p className="text-2xl font-bold">R$ {bill.amount.toFixed(2)}</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Data do {bill.type === 'pagar' ? 'Pagamento' : 'Recebimento'}</Label>
                              <Input
                                type="date"
                                value={paidDate}
                                onChange={(e) => setPaidDate(e.target.value)}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="partial"
                                checked={isPartial}
                                onChange={(e) => {
                                  setIsPartial(e.target.checked);
                                  if (!e.target.checked) {
                                    setPaidAmount(bill.amount.toString());
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="partial" className="cursor-pointer">
                                Pagamento/Recebimento Parcial
                              </Label>
                            </div>

                            {isPartial && (
                              <div className="space-y-2">
                                <Label htmlFor="paid-amount">
                                  Valor a {bill.type === 'pagar' ? 'Pagar' : 'Receber'}
                                </Label>
                                <Input
                                  id="paid-amount"
                                  type="number"
                                  step="0.01"
                                  value={paidAmount}
                                  onChange={(e) => setPaidAmount(e.target.value)}
                                  max={bill.amount}
                                />
                              </div>
                            )}
                            
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

                            <Button 
                              onClick={() => handlePayBill(bill.id, bill.amount)} 
                              className="w-full"
                            >
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
