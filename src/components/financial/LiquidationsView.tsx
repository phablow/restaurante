import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const LiquidationsView = () => {
  const { cardLiquidations } = useFinancial();

  const pendingLiquidations = cardLiquidations.filter(l => !l.liquidated);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidações de Cartões (D+1)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Venda</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Bandeira</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Taxa (R$)</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Liquidação</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingLiquidations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma liquidação pendente
                </TableCell>
              </TableRow>
            ) : (
              pendingLiquidations.map(liq => (
                <TableRow key={liq.id}>
                  <TableCell>{new Date(liq.saleDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="capitalize">{liq.paymentMethod}</TableCell>
                  <TableCell>
                    {liq.cardBrand === 'visa_master' ? 'Visa/Master' : 'Elo/Amex'}
                  </TableCell>
                  <TableCell>R$ {liq.saleAmount.toFixed(2)}</TableCell>
                  <TableCell>{(liq.taxRate * 100).toFixed(2)}%</TableCell>
                  <TableCell>R$ {liq.taxAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">R$ {liq.netAmount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(liq.liquidationDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {liq.liquidated ? (
                      <Badge variant="default">Liquidado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
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
