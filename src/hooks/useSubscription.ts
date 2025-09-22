import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionData {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
}

// Planos disponíveis
export const subscriptionTiers = {
  basic: {
    price_id: "price_1SAAe12cr9j2Q543DqSvOX1K",
    product_id: "prod_T6NOVjbPPIf2Km",
    name: "Básico",
    price: 39.00,
  },
  pro: {
    price_id: "price_1SAAeT2cr9j2Q5434hjEsJY7", 
    product_id: "prod_T6NPF6k2oT1Qdh",
    name: "Pro",
    price: 89.00,
  },
  premium: {
    price_id: "price_1SAAep2cr9j2Q5438bA7nlEV",
    product_id: "prod_T6NP1b7m6xaYWN",
    name: "Premium", 
    price: 179.00,
  }
};

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSubscription = useCallback(async (retryCount = 0) => {
    if (!user || !session) {
      setSubscriptionData({ subscribed: false });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        
        // Retry logic for temporary failures
        if (retryCount < 2) {
          console.log(`Retrying subscription check (attempt ${retryCount + 1})`);
          setTimeout(() => checkSubscription(retryCount + 1), 2000);
          return;
        }
        
        toast.error('Erro ao verificar assinatura');
        setSubscriptionData({ subscribed: false });
        return;
      }

      // Validate response data
      if (data && typeof data.subscribed === 'boolean') {
        setSubscriptionData(data);
      } else {
        console.error('Invalid subscription data received:', data);
        setSubscriptionData({ subscribed: false });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Retry for network errors
      if (retryCount < 2) {
        console.log(`Retrying subscription check after error (attempt ${retryCount + 1})`);
        setTimeout(() => checkSubscription(retryCount + 1), 2000);
        return;
      }
      
      toast.error('Erro ao verificar assinatura');
      setSubscriptionData({ subscribed: false });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const createCheckout = async (priceId: string) => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Erro ao criar checkout');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao criar checkout');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Erro ao abrir portal do cliente');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal do cliente');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    if (!subscriptionData.product_id) return null;
    
    return Object.values(subscriptionTiers).find(
      tier => tier.product_id === subscriptionData.product_id
    );
  };

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh assinatura a cada 5 minutos (otimizado)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const refreshSubscription = () => {
    checkSubscription();
  };

  const cancelSubscription = async () => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error canceling subscription:', error);
        toast.error('Erro ao cancelar assinatura');
        return false;
      }

      toast.success('Assinatura cancelada com sucesso');
      checkSubscription(); // Refresh subscription status
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    subscriptionData,
    loading,
    checkSubscription,
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
    cancelSubscription,
    getCurrentTier,
    subscriptionTiers,
  };
};