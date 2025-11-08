import { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export const EndOfDayPanel = () => {
  const { sales, executeEndOfDay, processLiquidations, pendings } = useFinancial();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const dailySales = sales.filter(s => s.date === selectedDate);
  const dailyBase = dailySales.reduce((sum, s) => sum + s.amount, 0);

  const handleExecute = () => {
    executeEndOfDay(selectedDate);
    toast.success('Fechamento do dia executado!');
  };

  const handleProcessLiquidations = () => {
    processLiquidations(selectedDate);
    toast.success('Liquidações processadas!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fechamento do Dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Base do Dia (vendas brutas):</span>
            <span className="font-semibold">R$ {dailyBase.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Alocação 20% (Investimento):</span>
            <span className="font-semibold">R$ {(dailyBase * 0.2).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Alocação 10% (Quitação Dívidas):</span>
            <span className="font-semibold">R$ {(dailyBase * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Reserva Folha:</span>
            <span className="font-semibold">R$ 130,00</span>
          </div>
        </div>

        {pendings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem {pendings.length} pendência(s) para compensar
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button onClick={handleExecute} className="w-full">
            Executar Fechamento do Dia
          </Button>
          <Button onClick={handleProcessLiquidations} variant="secondary" className="w-full">
            Processar Liquidações D+1
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
