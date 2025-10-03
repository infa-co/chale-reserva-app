import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-SUCCESS-EMAIL] ${step}${detailsStr}`);
};

interface PaymentSuccessEmailRequest {
  planName: string;
  planPrice: string;
  subscriptionEnd: string;
}

const validatePaymentSuccessEmailInput = (data: any): PaymentSuccessEmailRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Request body must be an object');
  }

  const { planName, planPrice, subscriptionEnd } = data;

  if (!planName || typeof planName !== 'string' || planName.trim().length === 0) {
    throw new Error('planName is required and must be a non-empty string');
  }

  if (!planPrice || typeof planPrice !== 'string') {
    throw new Error('planPrice is required and must be a string');
  }

  if (!subscriptionEnd || typeof subscriptionEnd !== 'string') {
    throw new Error('subscriptionEnd is required and must be a string');
  }

  return {
    planName: planName.trim(),
    planPrice: planPrice.trim(),
    subscriptionEnd: subscriptionEnd.trim()
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User email not found");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { planName, planPrice, subscriptionEnd } = validatePaymentSuccessEmailInput(body);
    logStep("Request validated", { planName, planPrice });

    // Buscar nome do perfil
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = profileData?.name || 'Olá';
    logStep("Profile fetched", { userName });

    const formattedDate = new Date(subscriptionEnd).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const { error: emailError, data: emailData } = await resend.emails.send({
      from: "Ordomo <billing@ordomo.com.br>",
      to: [user.email],
      subject: `✅ Pagamento Confirmado - Bem-vindo ao Plano ${planName}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Confirmado - Ordomo</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Olá ${userName},</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Seu pagamento foi processado com sucesso! 🎊 Bem-vindo ao <strong>Plano ${planName}</strong> do Ordomo.
              </p>

              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 5px;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📋 Detalhes da Assinatura</h2>
                <p style="margin: 8px 0;"><strong>Plano:</strong> ${planName}</p>
                <p style="margin: 8px 0;"><strong>Valor:</strong> ${planPrice}</p>
                <p style="margin: 8px 0;"><strong>Renovação:</strong> ${formattedDate}</p>
              </div>

              <h3 style="color: #667eea; margin-top: 30px; margin-bottom: 15px;">✨ O que você pode fazer agora:</h3>
              
              <ul style="list-style: none; padding: 0; margin: 20px 0;">
                <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  🏠 <strong>Cadastre suas propriedades</strong> - Configure todos os detalhes
                </li>
                <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  📅 <strong>Gerencie reservas</strong> - Adicione e acompanhe suas reservas
                </li>
                <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  📊 <strong>Visualize estatísticas</strong> - Acompanhe seu desempenho
                </li>
                <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  🔗 <strong>Sincronize calendários</strong> - Integre com Airbnb, Booking.com e outras plataformas
                </li>
                <li style="padding: 12px 0;">
                  💬 <strong>Comunique-se com hóspedes</strong> - Use modelos de mensagens profissionais
                </li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('https://lwmwwsthduvmuyhynwol.supabase.co', 'https://ordomo.com.br') || 'https://ordomo.com.br'}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Acessar Meu Dashboard
                </a>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>💡 Dica:</strong> Explore todos os recursos do seu plano acessando as configurações e conhecendo cada funcionalidade disponível.
                </p>
              </div>

              <h3 style="color: #667eea; margin-top: 30px; margin-bottom: 15px;">📞 Precisa de Ajuda?</h3>
              <p style="font-size: 14px; margin-bottom: 10px;">
                Nossa equipe está pronta para ajudar:
              </p>
              <ul style="font-size: 14px; margin-bottom: 30px;">
                <li>📧 Email: <a href="mailto:suporte@ordomo.com.br" style="color: #667eea;">suporte@ordomo.com.br</a></li>
                <li>💬 WhatsApp: Disponível no seu dashboard</li>
                <li>📚 <a href="https://ordomo.com.br/ajuda" style="color: #667eea;">Central de Ajuda</a></li>
              </ul>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Obrigado por escolher o Ordomo para gerenciar suas propriedades! 🏡
              </p>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Atenciosamente,<br>
                <strong>Equipe Ordomo</strong>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} Ordomo - Gestão Inteligente de Propriedades</p>
              <p style="margin: 5px 0;">
                <a href="https://ordomo.com.br/termos" style="color: #999; text-decoration: none;">Termos de Uso</a> | 
                <a href="https://ordomo.com.br/privacidade" style="color: #999; text-decoration: none;">Privacidade</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Email error", { error: emailError });
      throw emailError;
    }

    logStep("Email sent successfully", { emailId: emailData?.id });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});