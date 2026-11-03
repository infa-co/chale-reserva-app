export type Plan = 'basic' | 'pro' | 'premium';
export const TRIAL_DAYS = 7;

export function resolveAccess(input: {
  isAdmin: boolean;
  manualAccess: boolean;
  manualPlan?: string;
  trialEndsAt: string | null;
  paidPlan: Plan | null;
  stripeTrialEndsAt?: string | null;
}, now = Date.now()) {
  const manual = input.isAdmin || input.manualAccess;
  const trialEndsAt = input.stripeTrialEndsAt ?? input.trialEndsAt;
  const isTrial = !manual && !input.paidPlan && Boolean(trialEndsAt && Date.parse(trialEndsAt) > now);
  const manualPlan: Plan = input.manualPlan === 'basic' || input.manualPlan === 'pro' ? input.manualPlan : 'premium';
  return {
    hasAccess: manual || Boolean(input.paidPlan) || isTrial,
    plan: input.isAdmin ? 'premium' as Plan : input.manualAccess ? manualPlan : input.paidPlan ?? (isTrial ? 'premium' as Plan : null),
    isTrial,
    trialEndsAt,
    isAdmin: input.isAdmin,
    manualAccess: manual,
    trialExpired: !manual && !input.paidPlan && Boolean(trialEndsAt && Date.parse(trialEndsAt) <= now),
  };
}