import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { loading, hasAccess, error, refreshAccess, trialExpired } = useAccess();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" role="status">
      <div className="text-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p></div>
    </div>
  );
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="alert" className="text-foreground">Não foi possível verificar seu acesso. Suas reservas continuam salvas.</p>
      <Button onClick={() => void refreshAccess()}>Tentar novamente</Button>
    </div>
  );
  if (!hasAccess) return <Navigate to="/payment" state={{ trialExpired }} replace />;
  return <>{children}</>;
};
export default ProtectedRoute;
