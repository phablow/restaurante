import { useEffect } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { bills } = useFinancial();

  useEffect(() => {
    const checkBills = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      bills.forEach(bill => {
        if (bill.status === 'pendente') {
          const dueDate = new Date(bill.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // 3 dias antes
          if (diffDays === 3) {
            toast.warning(
              `Conta ${bill.type === 'pagar' ? 'a pagar' : 'a receber'} vencendo em 3 dias`,
              {
                description: `${bill.description} - R$ ${bill.amount.toFixed(2)}`,
              }
            );
          }

          // No dia
          if (diffDays === 0) {
            toast.error(
              `Conta ${bill.type === 'pagar' ? 'a pagar' : 'a receber'} vence hoje!`,
              {
                description: `${bill.description} - R$ ${bill.amount.toFixed(2)}`,
              }
            );
          }

          // Vencida
          if (diffDays < 0) {
            toast.error(
              `Conta ${bill.type === 'pagar' ? 'a pagar' : 'a receber'} vencida!`,
              {
                description: `${bill.description} - R$ ${bill.amount.toFixed(2)} - Venceu há ${Math.abs(diffDays)} dia(s)`,
              }
            );
          }
        }
      });
    };

    // Verificar ao carregar
    checkBills();

    // Verificar a cada hora
    const interval = setInterval(checkBills, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [bills]);
};
