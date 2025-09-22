import { useSubscription } from './useSubscription';
import { useAuth } from '@/contexts/AuthContext';

export interface PlanLimits {
  maxBookingsPerMonth: number | null; // null = unlimited
  maxProperties: number | null;
  hasWhatsAppIntegration: boolean;
  hasFinancialDashboard: boolean;
  hasReportsExport: boolean;
  hasAirbnbSync: boolean;
  hasICalExport: boolean;
  hasMultiProperty: boolean;
  hasPrioritySupport: boolean;
  hasHistoricalBookings: boolean;
  airbnbSyncType: 'none' | 'export-only' | 'bidirectional';
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  basic: {
    maxBookingsPerMonth: 15,
    maxProperties: 1,
    hasWhatsAppIntegration: false,
    hasFinancialDashboard: false,
    hasReportsExport: false,
    hasAirbnbSync: false,
    hasICalExport: false,
    hasMultiProperty: false,
    hasPrioritySupport: false,
    hasHistoricalBookings: false,
    airbnbSyncType: 'none'
  },
  pro: {
    maxBookingsPerMonth: 50,
    maxProperties: 3,
    hasWhatsAppIntegration: true,
    hasFinancialDashboard: true,
    hasReportsExport: true,
    hasAirbnbSync: false,
    hasICalExport: true,
    hasMultiProperty: true,
    hasPrioritySupport: false,
    hasHistoricalBookings: true,
    airbnbSyncType: 'export-only'
  },
  premium: {
    maxBookingsPerMonth: null, // unlimited
    maxProperties: null, // unlimited
    hasWhatsAppIntegration: true,
    hasFinancialDashboard: true,
    hasReportsExport: true,
    hasAirbnbSync: true,
    hasICalExport: true,
    hasMultiProperty: true,
    hasPrioritySupport: true,
    hasHistoricalBookings: true,
    airbnbSyncType: 'bidirectional'
  }
};

export const usePlanRestrictions = () => {
  const { subscriptionData, getCurrentTier } = useSubscription();
  const { user } = useAuth();
  
  const getCurrentPlan = (): string => {
    // Durante desenvolvimento, verificar se há plano simulado
    if (user && typeof window !== 'undefined') {
      const simulatedPlan = localStorage.getItem(`test_plan_${user.id}`);
      if (simulatedPlan && ['basic', 'pro', 'premium'].includes(simulatedPlan)) {
        return simulatedPlan;
      }
    }
    
    if (!subscriptionData.subscribed) return 'basic';
    
    const tier = getCurrentTier();
    if (!tier) return 'basic';
    
    if (tier.name === 'Básico') return 'basic';
    if (tier.name === 'Pro') return 'pro';
    if (tier.name === 'Premium') return 'premium';
    
    return 'basic';
  };

  const currentPlan = getCurrentPlan();
  const limits = PLAN_LIMITS[currentPlan];

  const checkFeatureAccess = (feature: keyof PlanLimits): boolean => {
    return Boolean(limits[feature]);
  };

  const checkBookingLimit = (currentBookingsThisMonth: number): boolean => {
    if (limits.maxBookingsPerMonth === null) return true; // unlimited
    return currentBookingsThisMonth < limits.maxBookingsPerMonth;
  };

  const checkPropertyLimit = (currentPropertiesCount: number): boolean => {
    if (limits.maxProperties === null) return true; // unlimited
    return currentPropertiesCount < limits.maxProperties;
  };

  const getUpgradeMessage = (feature: string): string => {
    switch (currentPlan) {
      case 'basic':
        return `Upgrade para o plano Pro para acessar ${feature}`;
      case 'pro':
        return `Upgrade para o plano Premium para acessar ${feature}`;
      default:
        return `Upgrade seu plano para acessar ${feature}`;
    }
  };

  const getNextPlanId = (): 'basic' | 'pro' | 'premium' | null => {
    switch (currentPlan) {
      case 'basic':
        return 'pro';
      case 'pro':
        return 'premium';
      default:
        return null;
    }
  };

  return {
    currentPlan,
    limits,
    checkFeatureAccess,
    checkBookingLimit,
    checkPropertyLimit,
    getUpgradeMessage,
    getNextPlanId,
    isFeatureEnabled: checkFeatureAccess
  };
};