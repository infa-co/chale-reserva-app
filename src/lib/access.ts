export type AccessPlan = 'basic' | 'pro' | 'premium';
export interface AccessData {
  hasAccess: boolean;
  plan: AccessPlan | null;
  isTrial: boolean;
  trialEndsAt: string | null;
  trialExpired: boolean;
  isAdmin: boolean;
  manualAccess: boolean;
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
  trial_end?: string;
}
export const deniedAccess: AccessData = {
  hasAccess: false, plan: null, isTrial: false, trialEndsAt: null,
  trialExpired: false, isAdmin: false, manualAccess: false, subscribed: false,
};