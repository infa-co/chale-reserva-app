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
  airbnbSyncType: 'none' | 'export-only' | 'bidirectional';
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxBookingsPerMonth: 5,
    maxProperties: 1,
    hasWhatsAppIntegration: false,
    hasFinancialDashboard: false,
    hasReportsExport: false,
    hasAirbnbSync: false,
    hasICalExport: false,
    hasMultiProperty: false,
    hasPrioritySupport: false,
    airbnbSyncType: 'none'
  },
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
    airbnbSyncType: 'none'
  },
  pro: {
    maxBookingsPerMonth: 35,
    maxProperties: 3,
    hasWhatsAppIntegration: true,
    hasFinancialDashboard: true,
    hasReportsExport: false,
    hasAirbnbSync: true,
    hasICalExport: true,
    hasMultiProperty: false,
    hasPrioritySupport: false,
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
      if (simulatedPlan && ['free', 'basic', 'pro', 'premium'].includes(simulatedPlan)) {
        return simulatedPlan;
      }
    }
    
    if (!subscriptionData.subscribed) return 'free';
    
    const tier = getCurrentTier();
    if (!tier) return 'free';
    
    if (tier.name === 'Básico') return 'basic';
    if (tier.name === 'Pro') return 'pro';
    if (tier.name === 'Premium') return 'premium';
    
    return 'free';
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
      case 'free':
        return `Upgrade para o plano Básico para acessar ${feature}`;
      case 'basic':
        return `Upgrade para o plano Pro para acessar ${feature}`;
      case 'pro':
        return `Upgrade para o plano Premium para acessar ${feature}`;
      default:
        return `Upgrade necessário para acessar ${feature}`;
    }
  };

  const getNextPlanId = (): 'basic' | 'pro' | 'premium' | null => {
    switch (currentPlan) {
      case 'free':
        return 'basic';
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