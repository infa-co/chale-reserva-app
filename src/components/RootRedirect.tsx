import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);

  // Aguarda 200ms após o carregamento do Auth para garantir que o Supabase terminou
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Mostra tela de loading enquanto espera
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-600">Carregando Ordomo...</p>
        </div>
      </div>
    );
  }

  // Usuário logado → vai pro dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Usuário não logado
  return <Navigate to={isMobile ? '/auth' : '/site'} replace />;
};

export default RootRedirect;
