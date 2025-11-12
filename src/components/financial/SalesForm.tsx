import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PaymentMethod, CardBrand } from '@/types/financial';
import { Plus } from 'lucide-react';
import { getTodayString } from '@/lib/dateUtils';

export const SalesForm = () => {
  const { addSale } = useFinancial();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saleType, setSaleType] = useState('outros');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cardBrand, setCardBrand] = useState<CardBrand>('visa_master');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const resetForm = () => {
    setAmount('');
    setDate(getTodayString());
    setSaleType('outros');
    setPaymentMethod('dinheiro');
    setCardBrand('visa_master');
    setDescription('');
    setJustSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (!date) {
      toast.error('Data obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      const sale = {
        date,
        amount: parseFloat(amount),
        paymentMethod,
        cardBrand: (paymentMethod === 'credito' || paymentMethod === 'debito') ? cardBrand : undefined,
        description: description || undefined,
        saleType,
      };

      await addSale(sale);
      toast.success('Venda registrada com sucesso!');
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
      toast.error('Erro ao registrar venda');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (justSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrar Venda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Venda registrada com sucesso!</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Venda</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saleType">Tipo de Venda</Label>
                    <Select value={saleType} onValueChange={setSaleType}>
                      <SelectTrigger id="saleType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marmita">Marmita</SelectItem>
                        <SelectItem value="pf">PF (Prato Feito)</SelectItem>
                        <SelectItem value="quilo">Quilo</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Meio de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX (InfinitePay)</SelectItem>
                        <SelectItem value="credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="debito">Cartão de Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
                    <div className="space-y-2">
                      <Label htmlFor="cardBrand">Bandeira</Label>
                      <Select value={cardBrand} onValueChange={(v) => setCardBrand(v as CardBrand)}>
                        <SelectTrigger id="cardBrand">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa_master">Visa / Mastercard</SelectItem>
                          <SelectItem value="elo_amex">Elo / American Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Mesa 5, Delivery, etc."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Registrar Venda'}
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
        <CardTitle>Registrar Venda</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nova Venda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleType">Tipo de Venda</Label>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger id="saleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marmita">Marmita</SelectItem>
                    <SelectItem value="pf">PF (Prato Feito)</SelectItem>
                    <SelectItem value="quilo">Quilo</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Meio de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX (InfinitePay)</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
                <div className="space-y-2">
                  <Label htmlFor="cardBrand">Bandeira</Label>
                  <Select value={cardBrand} onValueChange={(v) => setCardBrand(v as CardBrand)}>
                    <SelectTrigger id="cardBrand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa_master">Visa / Mastercard</SelectItem>
                      <SelectItem value="elo_amex">Elo / American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Mesa 5, Delivery, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Venda'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
