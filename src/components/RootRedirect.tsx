import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sage-600">Carregando Ordomo...</p>
      </div>
    </div>
  );
}

  // Se está autenticado, vai para o dashboard (mobile ou desktop)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se não está autenticado
  if (isMobile) {
    // Mobile: vai direto para autenticação
    return <Navigate to="/auth" replace />;
  } else {
    // Desktop: mostra a landing page
    return <Navigate to="/site" replace />;
  }
};

export default RootRedirect;
