import { safeLog } from "../_shared/security.ts";
import { resolveAccess, TRIAL_DAYS, type Plan } from "../_shared/access.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: unknown) => safeLog("CHECK-SUBSCRIPTION", step, details);

// Stripe products of each plan (same ids the checkout uses).
const PLAN_BY_PRODUCT: Record<string, Plan> = {
  prod_T6NOVjbPPIf2Km: "basic",
  prod_T6NPF6k2oT1Qdh: "pro",
  prod_T6NP1b7m6xaYWN: "premium",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Access the app grants on its own: administrators, manual grants and the free trial.
    const [{ data: adminRole }, { data: accessRow }] = await Promise.all([
      supabaseClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      supabaseClient.from("user_access").select("trial_ends_at, manual_access, manual_plan").eq("user_id", user.id).maybeSingle(),
    ]);
    // Accounts created before the access table existed get the same window its backfill used.
    const trialEndsAt = accessRow?.trial_ends_at
      ?? new Date(Date.parse(user.created_at) + TRIAL_DAYS * 86400000).toISOString();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let hasActiveSub = false;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let cancelAtPeriodEnd = false;
    let trialEnd: string | null = null;

    if (customers.data.length === 0) {
      logStep("No customer found");
    } else {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer");
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      // A subscription still inside its Stripe trial is "trialing", not "active".
      const subscription = subscriptions.data.find((s: { status: string }) => s.status === "active")
        ?? subscriptions.data.find((s: { status: string }) => s.status === "trialing");

      if (subscription) {
        hasActiveSub = true;
        logStep("Active subscription found");

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
      } else {
        logStep("No active subscription found");
      }
    }

    // A paid subscription to an unrecognized product still grants the entry plan.
    const paidPlan: Plan | null = hasActiveSub ? PLAN_BY_PRODUCT[productId ?? ""] ?? "basic" : null;
    const access = resolveAccess({
      isAdmin: Boolean(adminRole),
      manualAccess: Boolean(accessRow?.manual_access),
      manualPlan: accessRow?.manual_plan ?? undefined,
      trialEndsAt,
      paidPlan,
    });

    return new Response(JSON.stringify({
      ...access,
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      trial_end: trialEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});