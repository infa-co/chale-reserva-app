import { useAuth } from '@/contexts/AuthContext';

// All consumers read the same user-scoped query owned by AuthProvider.
export function useAccess() {
  const { access, accessLoading, accessError, checkSubscription } = useAuth();
  return { ...access, loading: accessLoading, error: accessError, refreshAccess: checkSubscription };
}