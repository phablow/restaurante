import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PaymentMethod, CardBrand } from '@/types/financial';

export const SalesForm = () => {
  const { addSale } = useFinancial();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleType, setSaleType] = useState('outros');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cardBrand, setCardBrand] = useState<CardBrand>('visa_master');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setSaleType('outros');
      setDescription('');
    } catch (error) {
      toast.error('Erro ao registrar venda');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Venda</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};
