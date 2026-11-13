// One place that answers "what may this account use right now?".
// check-subscription calls it for the app; the WhatsApp assistant calls it for people who
// never open the app. Both store the paid plan so database triggers enforce the same limits.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { resolveAccess, TRIAL_DAYS, type Plan } from "./access.ts";

// Stripe products of each plan (same ids the checkout uses).
const PLAN_BY_PRODUCT: Record<string, Plan> = {
  prod_T6NOVjbPPIf2Km: "basic",
  prod_T6NPF6k2oT1Qdh: "pro",
  prod_T6NP1b7m6xaYWN: "premium",
};

export interface AccessUser {
  id: string;
  email?: string | null;
  created_at: string;
}

// deno-lint-ignore no-explicit-any
type Admin = any;

export async function resolveUserAccess(admin: Admin, user: AccessUser, stripeKey: string) {
  if (!user.email) throw new Error("User email not available");

  // Access the app grants on its own: administrators, manual grants and the free trial.
  const [{ data: adminRole }, { data: accessRow }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    admin.from("user_access").select("trial_ends_at, manual_access, manual_plan").eq("user_id", user.id).maybeSingle(),
  ]);
  // Accounts created before the access table existed get the same window its backfill used.
  const trialEndsAt = accessRow?.trial_ends_at
    ?? new Date(Date.parse(user.created_at) + TRIAL_DAYS * 86400000).toISOString();

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });

  let subscribed = false;
  let productId: string | null = null;
  let subscriptionEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  let trialEnd: string | null = null;

  if (customers.data.length > 0) {
    const subscriptions = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "all", limit: 10 });
    // A subscription still inside its Stripe trial is "trialing", not "active".
    const subscription = subscriptions.data.find((s: { status: string }) => s.status === "active")
      ?? subscriptions.data.find((s: { status: string }) => s.status === "trialing");

    if (subscription) {
      subscribed = true;
      if (subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

      // Newer Stripe API versions report the period on the item instead of the subscription.
      const item = subscription.items?.data?.[0];
      const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
        ?? (item as unknown as { current_period_end?: number } | undefined)?.current_period_end;
      if (typeof periodEnd === "number") subscriptionEnd = new Date(periodEnd * 1000).toISOString();

      const product = item?.price?.product;
      productId = typeof product === "string" ? product : product?.id ?? null;
    }
  }

  // A paid subscription to an unrecognized product still grants the entry plan.
  const paidPlan: Plan | null = subscribed ? PLAN_BY_PRODUCT[productId ?? ""] ?? "basic" : null;
  const access = resolveAccess({
    isAdmin: Boolean(adminRole),
    manualAccess: Boolean(accessRow?.manual_access),
    manualPlan: accessRow?.manual_plan ?? undefined,
    trialEndsAt,
    paidPlan,
  });

  // Remember the paid plan so the database can enforce plan limits. A failure here must
  // not lock the person out of the app, so it is only logged.
  const { error: persistError } = await admin.from("user_access").upsert({
    user_id: user.id,
    trial_ends_at: trialEndsAt,
    paid_plan: paidPlan,
    plan_checked_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (persistError) console.error("[ACCESS] could not store resolved plan");

  return {
    ...access,
    subscribed,
    product_id: productId,
    subscription_end: subscriptionEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    trial_end: trialEnd,
  };
}

export { planAllows } from "./planFeatures.ts";
