import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AccountType } from '@/types/financial';
import { Plus } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Fornecedores',
  'Salários',
  'Impostos',
  'Manutenção',
  'Marketing',
  'Outros',
];

export const ExpenseForm = () => {
  const { addExpense } = useFinancial();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Outros');
  const [account, setAccount] = useState<AccountType>('caixa_dinheiro');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const resetForm = () => {
    setAmount('');
    setCategory('Outros');
    setAccount('caixa_dinheiro');
    setDescription('');
    setJustSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (!description) {
      toast.error('Descrição obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      const expense = {
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
        category,
        paymentMethod: account === 'caixa_dinheiro' ? 'dinheiro' as const : 'pix' as const,
        description,
        account,
      };

      await addExpense(expense);
      toast.success('Despesa registrada com sucesso!');
      setJustSubmitted(true);
      resetForm();
      
      // Fechar modal e reabrir após 500ms
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          setJustSubmitted(false);
        }, 300);
      }, 500);
    } catch (error) {
      toast.error('Erro ao registrar despesa');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (justSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrar Despesa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Despesa registrada com sucesso!</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Valor</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account">Pagar com</Label>
                    <Select value={account} onValueChange={(v) => setAccount(v as AccountType)}>
                      <SelectTrigger id="account">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caixa_dinheiro">Caixa Dinheiro</SelectItem>
                        <SelectItem value="caixa_pix">Caixa PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Descrição</Label>
                    <Input
                      id="expense-description"
                      placeholder="Descrição da despesa"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Registrar Despesa'}
                  </Button>
                </form>
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
        <CardTitle>Registrar Despesa</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nova Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Valor</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Pagar com</Label>
                <Select value={account} onValueChange={(v) => setAccount(v as AccountType)}>
                  <SelectTrigger id="account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caixa_dinheiro">Caixa Dinheiro</SelectItem>
                    <SelectItem value="caixa_pix">Caixa PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-description">Descrição</Label>
                <Input
                  id="expense-description"
                  placeholder="Descrição da despesa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Despesa'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
