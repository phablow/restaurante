import { useState } from 'react';
import { FinancialProvider } from '@/contexts/FinancialContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { UserManagement } from '@/components/auth/UserManagement';
import { useNotifications } from '@/hooks/useNotifications';
import { Dashboard } from '@/components/financial/Dashboard';
import { SalesForm } from '@/components/financial/SalesForm';
import { ExpenseForm } from '@/components/financial/ExpenseForm';
import { EndOfDayPanel } from '@/components/financial/EndOfDayPanel';
import { BillsManager } from '@/components/financial/BillsManager';
import { LiquidationsView } from '@/components/financial/LiquidationsView';
import { ReportsPanel } from '@/components/financial/ReportsPanel';
import { StatementPanel } from '@/components/financial/StatementPanel';
import { AdminPanel } from '@/components/financial/AdminPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FinancialApp = () => {
  useNotifications();
  const [showUserManagement, setShowUserManagement] = useState(false);

  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-background">
        <Header onShowUserManagement={() => setShowUserManagement(false)} />
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
          <UserManagement />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onShowUserManagement={() => setShowUserManagement(true)} />
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        <Dashboard />

        <Tabs defaultValue="relatorios" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="liquidacoes">Liquidações</TabsTrigger>
            <TabsTrigger value="extratos">Extratos</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="relatorios">
            <ReportsPanel />
          </TabsContent>

          <TabsContent value="lancamentos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SalesForm />
              <ExpenseForm />
            </div>
          </TabsContent>

          <TabsContent value="fechamento">
            <EndOfDayPanel />
          </TabsContent>

          <TabsContent value="contas">
            <BillsManager />
          </TabsContent>

          <TabsContent value="liquidacoes">
            <LiquidationsView />
          </TabsContent>

          <TabsContent value="extratos">
            <StatementPanel />
          </TabsContent>

          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <ProtectedRoute>
      <FinancialProvider>
        <FinancialApp />
      </FinancialProvider>
    </ProtectedRoute>
  );
};

export default Index;
