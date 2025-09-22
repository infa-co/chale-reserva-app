import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectToSettings = () => {
  const navigate = useNavigate();
  const { user, hasActiveSubscription, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true });
      } else if (hasActiveSubscription) {
        navigate('/', { replace: true });
      } else {
        navigate('/configuracoes', { replace: true });
      }
    }
  }, [user, hasActiveSubscription, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sage-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default RedirectToSettings;