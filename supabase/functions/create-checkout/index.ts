import { trustedOrigin, safeLog } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    safeLog("CREATE-CHECKOUT", "Create checkout function started");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      safeLog("CREATE-CHECKOUT", "No authorization header provided");
      throw new Error("Authorization header is required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    safeLog("CREATE-CHECKOUT", "Getting user with token");
    
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      safeLog("CREATE-CHECKOUT", "User authentication error:");
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      safeLog("CREATE-CHECKOUT", "User not found or email missing");
      throw new Error("User not authenticated or email not available");
    }
    
    safeLog("CREATE-CHECKOUT", "User authenticated:");

    const requestBody = await req.json();
    const { priceId } = requestBody;
    safeLog("CREATE-CHECKOUT", "Request body:");
    
    if (!priceId) {
      safeLog("CREATE-CHECKOUT", "Price ID missing from request");
      throw new Error("Price ID is required");
    }
    
    safeLog("CREATE-CHECKOUT", "Creating Stripe client");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    safeLog("CREATE-CHECKOUT", "Checking for existing customer:");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      safeLog("CREATE-CHECKOUT", "Found existing customer:");
    } else {
      safeLog("CREATE-CHECKOUT", "No existing customer found");
    }

    safeLog("CREATE-CHECKOUT", "Creating checkout session with priceId:");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${trustedOrigin(req.headers.get("origin"))}/onboarding?from_payment=true`,
      cancel_url: `${trustedOrigin(req.headers.get("origin"))}/payment-canceled`,
    });

    safeLog("CREATE-CHECKOUT", "Checkout session created successfully:");
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    safeLog("CREATE-CHECKOUT", "Error in create-checkout:");
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});