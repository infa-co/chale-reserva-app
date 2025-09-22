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
    price_id: "price_1SA8YlKF8m13UKNcHcc17kqM",
    product_id: "prod_T6LFeoeZCMrw0c",
    name: "Básico",
    price: 39.90,
  },
  pro: {
    price_id: "price_1SA8ZNKF8m13UKNcVbmfzjsA", 
    product_id: "prod_T6LFjV1m2D2gIC",
    name: "Pro",
    price: 89.90,
  },
  premium: {
    price_id: "price_1SA8ZxKF8m13UKNciiWekPOI",
    product_id: "prod_T6LGkx3eufdBo5",
    name: "Premium", 
    price: 179.90,
  }
};

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSubscription = useCallback(async () => {
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
        toast.error('Erro ao verificar assinatura');
        return;
      }

      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Erro ao verificar assinatura');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const createCheckout = async (priceId: string) => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

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
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

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

  // Auto-refresh assinatura a cada minuto
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    subscriptionData,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getCurrentTier,
    subscriptionTiers,
  };
};