import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AccountType } from '@/types/financial';

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
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Outros');
  const [account, setAccount] = useState<AccountType>('caixa_dinheiro');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (!description) {
      toast.error('Descrição obrigatória');
      return;
    }

    const expense = {
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      category,
      paymentMethod: account === 'caixa_dinheiro' ? 'dinheiro' as const : 'pix' as const,
      description,
      account,
    };

    addExpense(expense);
    toast.success('Despesa registrada com sucesso!');
    
    setAmount('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Despesa</CardTitle>
      </CardHeader>
      <CardContent>
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

          <Button type="submit" className="w-full">
            Registrar Despesa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
