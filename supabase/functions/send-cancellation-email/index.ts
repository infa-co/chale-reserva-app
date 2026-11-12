import { safeLog, trustedOrigin, escapeHtml } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => safeLog("SEND-CANCELLATION-EMAIL", step, details);

interface CancellationEmailRequest {
  currentPeriodEnd: string;
}

const validateCancellationEmailInput = (data: any): CancellationEmailRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { currentPeriodEnd } = data;

  if (!currentPeriodEnd || typeof currentPeriodEnd !== 'string') {
    throw new Error('Invalid current period end date');
  }

  return { currentPeriodEnd: currentPeriodEnd.trim() };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const requestBody = await req.json();
    const { currentPeriodEnd } = validateCancellationEmailInput(requestBody);

    // Get user profile for personalized greeting
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = profile?.name || user.email.split('@')[0];
    const endDate = new Date(currentPeriodEnd).toLocaleDateString('pt-BR');

    logStep("Sending cancellation email", { to: user.email, endDate });

    const emailResponse = await resend.emails.send({
      from: "Ordomo <billing@ordomo.com.br>",
      to: [user.email],
      subject: `😔 Assinatura cancelada - Ordomo`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assinatura Cancelada</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1F1F1F; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F9F9F9;">

          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

            <!-- Header com logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background: linear-gradient(135deg, #8B5A3C, #A0522D); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 32px; font-weight: bold;">O</span>
              </div>
              <h1 style="color: #8B5A3C; margin: 0; font-size: 28px; font-weight: 700;">Ordomo</h1>
            </div>

            <!-- Mensagem principal -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
                😔 Assinatura Cancelada
              </h2>
              <p style="color: #666666; font-size: 16px; margin: 0;">
                Olá, ${escapeHtml(userName)}. Confirmamos o cancelamento da sua assinatura do Ordomo.
              </p>
            </div>

            <!-- Informações do cancelamento -->
            <div style="background-color: #FEF2F2; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #EF4444;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📅 Informações importantes:</h3>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Data do cancelamento:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
                <li style="margin-bottom: 8px;"><strong>Acesso até:</strong> ${endDate}</li>
                <li style="margin-bottom: 8px;"><strong>Status:</strong> Cancelado (ativo até o fim do período)</li>
                <li style="margin-bottom: 8px;"><strong>Cobrança:</strong> Não haverá renovação automática</li>
              </ul>
            </div>

            <!-- O que acontece agora -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🔄 O que acontece agora:</h3>
              <ol style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Acesso mantido</strong> - Você continua com acesso completo até ${endDate}</li>
                <li style="margin-bottom: 8px;"><strong>Dados preservados</strong> - Suas informações ficam seguras por 30 dias</li>
                <li style="margin-bottom: 8px;"><strong>Sem cobrança</strong> - Não haverá renovação automática</li>
                <li style="margin-bottom: 8px;"><strong>Reativação</strong> - Você pode reativar a qualquer momento</li>
              </ol>
            </div>

            <!-- Motivos comuns e soluções -->
            <div style="background-color: #F0F9FF; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #0EA5E9;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">💡 Algo não funcionou como esperado?</h3>
              <p style="color: #666666; margin: 0 0 12px 0;">Se você cancelou por algum problema específico, adoraríamos ter uma chance de resolver:</p>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Dificuldades técnicas</strong> - Nossa equipe pode ajudar</li>
                <li style="margin-bottom: 8px;"><strong>Recursos faltando</strong> - Talvez tenhamos uma solução</li>
                <li style="margin-bottom: 8px;"><strong>Preço alto</strong> - Podemos conversar sobre opções</li>
                <li style="margin-bottom: 8px;"><strong>Não está usando</strong> - Podemos mostrar recursos que você pode ter perdido</li>
              </ul>
            </div>

            <!-- Feedback -->
            <div style="background-color: #F9FAFB; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">💬 Nos ajude a melhorar</h3>
              <p style="color: #666666; margin: 0 0 16px 0;">
                Seu feedback é muito importante para nós. O que podemos fazer melhor?
              </p>
              <a href="https://wa.me/5511999999999?text=Cancelei%20minha%20assinatura%20do%20Ordomo%20porque..."
                 style="display: inline-block; background: linear-gradient(135deg, #8B5A3C, #A0522D); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                💬 Enviar Feedback
              </a>
            </div>

            <!-- Fácil reativação -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🔄 Mudou de ideia?</h3>
              <p style="color: #666666; margin: 0 0 16px 0;">
                Você pode reativar sua assinatura a qualquer momento com apenas alguns cliques:
              </p>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Acesse sua conta no Ordomo</li>
                <li style="margin-bottom: 8px;">Vá em "Configurações > Assinatura"</li>
                <li style="margin-bottom: 8px;">Clique em "Reativar assinatura"</li>
                <li style="margin-bottom: 8px;">Seus dados estarão lá esperando por você!</li>
              </ul>
            </div>

            <!-- Botões de ação -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${trustedOrigin(req.headers.get("origin"))}"
                 style="display: inline-block; background: linear-gradient(135deg, #8B5A3C, #A0522D); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px 8px;">
                🔄 Reativar Assinatura
              </a>
              <br>
              <a href="${trustedOrigin(req.headers.get("origin"))}/dashboard"
                 style="display: inline-block; background-color: transparent; color: #8B5A3C; padding: 12px 24px; text-decoration: none; border: 2px solid #8B5A3C; border-radius: 8px; font-weight: 600; margin: 0 8px;">
                📊 Acessar Dashboard
              </a>
            </div>

            <!-- Agradecimento especial -->
            <div style="background-color: #F3F4F6; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin: 0; font-style: italic;">
                "Obrigado por ter escolhido o Ordomo. Esperamos te ver de volta em breve!"
              </p>
              <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">
                - Equipe Ordomo
              </p>
            </div>

            <!-- Links de contato -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-bottom: 24px;">
              <h4 style="color: #1F1F1F; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📞 Fale conosco:</h4>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li><a href="${trustedOrigin(req.headers.get("origin"))}/legal/support" style="color: #8B5A3C; text-decoration: none;">Central de Ajuda</a></li>
                <li><a href="mailto:support@ordomo.com" style="color: #8B5A3C; text-decoration: none;">Email: support@ordomo.com</a></li>
                <li><a href="https://wa.me/5511999999999?text=Olá!%20Cancelei%20minha%20assinatura%20e%20gostaria%20de%20conversar." style="color: #8B5A3C; text-decoration: none;">WhatsApp: (11) 99999-9999</a></li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 24px; color: #666666; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                Foi um prazer ter você conosco. Até a próxima!
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                <strong>Ordomo</strong> - Gestão inteligente de hospedagem
                <br>
                <a href="${trustedOrigin(req.headers.get("origin"))}/legal/privacy" style="color: #8B5A3C; text-decoration: none;">Política de Privacidade</a> |
                <a href="${trustedOrigin(req.headers.get("origin"))}/legal/terms" style="color: #8B5A3C; text-decoration: none;">Termos de Uso</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-cancellation-email", { message: errorMessage });

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
