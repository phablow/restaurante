import { useState } from 'react';
import { FinancialProvider } from '@/contexts/FinancialContext';
import { AuthProvider } from '@/contexts/AuthContext';
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

        <Tabs defaultValue="lancamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="liquidacoes">Liquidações</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <FinancialProvider>
          <FinancialApp />
        </FinancialProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default Index;
