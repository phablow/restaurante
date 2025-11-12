import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { getTodayString } from '@/lib/dateUtils';

// Função auxiliar para subtrair dias de uma data sem problemas de timezone
const subtractDaysFromDateString = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
};

export const EndOfDayPanel = () => {
  const { sales, bills, cardLiquidations, executeEndOfDay, processLiquidations } = useFinancial();
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isLoading, setIsLoading] = useState(false);

  // Calcular base do dia (vendas + contas a receber)
  const dailySales = sales.filter(s => s.date === selectedDate);
  const dailyReceipt = bills.filter(
    b => b.type === 'receber' && b.dueDate === selectedDate && b.status === 'pago'
  );

  const dailySalesAmount = dailySales.reduce((sum, s) => sum + s.amount, 0);
  const dailyReceiptAmount = dailyReceipt.reduce((sum, b) => sum + b.amount, 0);
  const totalDailyBase = dailySalesAmount + dailyReceiptAmount;

  // Calcular liquidações do dia anterior que chegam hoje
  const yesterdayFormatted = subtractDaysFromDateString(selectedDate, 1);

  const liquidationsFromYesterday = cardLiquidations.filter(
    liq => liq.liquidationDate === selectedDate && liq.saleDate === yesterdayFormatted && !liq.liquidated
  );
  const liquidationsAmount = liquidationsFromYesterday.reduce((sum, l) => sum + l.netAmount, 0);

  // Receita total do dia (vendas + contas + liquidações)
  const totalRevenue = totalDailyBase + liquidationsAmount;

  // Calcular percentuais (20% e 10% sobre TODA receita que entra no dia)
  const allocation20 = totalRevenue * 0.20;
  const allocation10 = totalRevenue * 0.10;
  const reserve130 = 130;

  const handleExecuteEndOfDay = async () => {
    if (totalDailyBase === 0 && liquidationsAmount === 0) {
      toast.error('Nenhuma venda ou liquidação para este dia');
      return;
    }

    setIsLoading(true);
    try {
      await executeEndOfDay(selectedDate);
      toast.success('Fechamento do dia executado!');
    } catch (error) {
      toast.error('Erro ao executar fechamento');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessLiquidations = async () => {
    if (liquidationsFromYesterday.length === 0) {
      toast.error('Nenhuma liquidação pendente para este dia');
      return;
    }

    setIsLoading(true);
    try {
      await processLiquidations(selectedDate);
      toast.success('Liquidações processadas e despesas de taxa criadas!');
    } catch (error) {
      toast.error('Erro ao processar liquidações');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fechamento do Dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="closing-date" className="text-sm font-medium">
            Data do Fechamento
          </label>
          <input
            id="closing-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded border border-input bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Vendas do dia (bruto):</span>
            <span className="font-semibold">R$ {dailySalesAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Contas a receber (confirmadas):</span>
            <span className="font-semibold">R$ {dailyReceiptAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Liquidações do dia anterior:</span>
            <span className="font-semibold">R$ {liquidationsAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-semibold">Receita Total do Dia:</span>
            <span className="text-lg font-bold">R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          {isAdmin && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Alocação 20% (Investimento):</span>
              <span className="font-semibold">R$ {allocation20.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Alocação 10% (Quitação Dívidas):</span>
            <span className="font-semibold">R$ {allocation10.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Reserva Folha (R$ 130/dia):</span>
            <span className="font-semibold">R$ {reserve130.toFixed(2)}</span>
          </div>
        </div>

        {liquidationsFromYesterday.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {liquidationsFromYesterday.length} liquidação(ões) de cartão aguardando processamento
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 pt-4">
          <Button 
            onClick={handleExecuteEndOfDay} 
            className="w-full" 
            disabled={totalDailyBase === 0 || isLoading}
          >
            {isLoading ? 'Processando...' : 'Executar Fechamento do Dia'}
          </Button>
          <Button
            onClick={handleProcessLiquidations}
            variant="secondary"
            className="w-full"
            disabled={liquidationsFromYesterday.length === 0 || isLoading}
          >
            {isLoading ? 'Processando...' : `Processar Liquidações D+1 (${liquidationsFromYesterday.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
