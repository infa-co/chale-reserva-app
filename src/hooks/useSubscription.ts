import { useState, useEffect, useCallback } from 'react';
import { useAccess } from './useAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { user, session } = useAuth();
  const access = useAccess();
  const subscriptionData = access;
  const [actionLoading, setLoading] = useState(false);
  const loading = access.loading || actionLoading;
  const checkSubscription = access.refreshAccess;

  useEffect(() => {
    const data = access;
    if (!session || access.loading) return;
    const notify = async () => {
        // Notify once when checkout changes the paid tier
        const oldTierData = localStorage.getItem('ordomo_old_tier');
        if (oldTierData && data.subscribed && data.product_id) {
          try {
            const oldTier = JSON.parse(oldTierData);
            localStorage.removeItem('ordomo_old_tier');
            const newTier = Object.values(subscriptionTiers).find(
              tier => tier.product_id === data.product_id
            );
            
            if (newTier && oldTier.product_id !== newTier.product_id) {
              // Send plan change email
              const changeType = newTier.price > oldTier.price ? 'upgrade' : 'downgrade';
              
              const { error: emailError } = await supabase.functions.invoke('send-plan-change-email', {
                body: {
                  oldPlan: oldTier.name,
                  newPlan: newTier.name,
                  newPrice: `R$ ${newTier.price.toFixed(2)}`,
                  changeType
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (emailError) {
                console.error('Error sending plan change email:', emailError);
              }
            }
            
            // The stored tier is only for notification, never access.
            localStorage.removeItem('ordomo_old_tier');
          } catch (e) {
            console.error('Error processing plan change:', e);
            localStorage.removeItem('ordomo_old_tier');
          }
        }
        
    };
    void notify();
  }, [access.product_id, access.subscribed, access.loading, session]);

  const createCheckout = async (priceId: string) => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return;
    }

    const oldTier = getCurrentTier();
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
        // Store old tier for plan change detection
        if (oldTier) {
          localStorage.setItem('ordomo_old_tier', JSON.stringify(oldTier));
        }
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

  const getCurrentTier = useCallback(() => {
    if (!subscriptionData.product_id) return null;
    return Object.values(subscriptionTiers).find(tier => tier.product_id === subscriptionData.product_id);
  }, [subscriptionData.product_id]);

  const refreshSubscription = checkSubscription;

  const cancelSubscription = async () => {
    if (!session) {
      toast.error('Usuário não autenticado');
      return { success: false };
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
        return { success: false };
      }

      return {
        success: true,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
        currentPeriodEnd: data?.currentPeriodEnd
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
      return { success: false };
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