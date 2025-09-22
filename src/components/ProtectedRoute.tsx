import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { subscriptionData, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar se é um usuário de teste (permite acesso sem assinatura para teste)
  const isTestUser = user && typeof window !== 'undefined' && 
    localStorage.getItem(`test_plan_${user.id}`);

  // Verificar se o usuário tem assinatura ativa OU é um usuário de teste
  if (!subscriptionData.subscribed && !isTestUser) {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;