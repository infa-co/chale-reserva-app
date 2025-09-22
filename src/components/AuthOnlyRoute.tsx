import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface AuthOnlyRouteProps {
  children: React.ReactNode;
}

const AuthOnlyRoute = ({ children }: AuthOnlyRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se o usuário já está logado, redireciona para verificar assinatura
  if (user) {
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
};

export default AuthOnlyRoute;