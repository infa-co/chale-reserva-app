import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PASSWORD-RESET-EMAIL] ${step}${detailsStr}`);
};

interface PasswordResetEmailRequest {
  type: 'reset_requested' | 'password_changed';
}

const validatePasswordResetEmailInput = (data: any): PasswordResetEmailRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { type } = data;
  
  if (!type || !['reset_requested', 'password_changed'].includes(type)) {
    throw new Error('Invalid email type');
  }
  
  return { type };
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
    const { type } = validatePasswordResetEmailInput(requestBody);

    // Get user profile for personalized greeting
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = profile?.name || user.email.split('@')[0];
    
    logStep("Sending password reset email", { to: user.email, type });

    const isResetRequest = type === 'reset_requested';
    const subject = isResetRequest 
      ? `🔐 Solicitação de alteração de senha - Ordomo`
      : `✅ Senha alterada com sucesso - Ordomo`;

    const emailResponse = await resend.emails.send({
      from: "Ordomo <security@resend.dev>",
      to: [user.email],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isResetRequest ? 'Redefinir Senha' : 'Senha Alterada'}</title>
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
                ${isResetRequest ? '🔐 Solicitação de Redefinição de Senha' : '✅ Senha Alterada com Sucesso'}
              </h2>
              <p style="color: #666666; font-size: 16px; margin: 0;">
                ${isResetRequest 
                  ? `Olá, ${userName}! Recebemos uma solicitação para redefinir a senha da sua conta.`
                  : `Olá, ${userName}! Sua senha foi alterada com sucesso.`
                }
              </p>
            </div>

            <!-- Informações de segurança -->
            <div style="background-color: ${isResetRequest ? '#FEF3C7' : '#D1FAE5'}; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid ${isResetRequest ? '#F59E0B' : '#10B981'};">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                ${isResetRequest ? '⚠️ Informações importantes:' : '🛡️ Sua conta está segura:'}
              </h3>
              ${isResetRequest ? `
                <ul style="color: #666666; padding-left: 20px; margin: 0;">
                  <li style="margin-bottom: 8px;">Se você <strong>solicitou</strong> esta alteração, siga as instruções no email de redefinição</li>
                  <li style="margin-bottom: 8px;">Se você <strong>não solicitou</strong> esta alteração, ignore este email</li>
                  <li style="margin-bottom: 8px;">Por segurança, verifique se não há acessos indevidos em sua conta</li>
                  <li style="margin-bottom: 8px;">Este link expira em 24 horas por segurança</li>
                </ul>
              ` : `
                <ul style="color: #666666; padding-left: 20px; margin: 0;">
                  <li style="margin-bottom: 8px;">Sua senha foi alterada em ${new Date().toLocaleString('pt-BR')}</li>
                  <li style="margin-bottom: 8px;">Se você não fez esta alteração, entre em contato conosco imediatamente</li>
                  <li style="margin-bottom: 8px;">Recomendamos usar uma senha forte e única</li>
                  <li style="margin-bottom: 8px;">Mantenha suas informações de login sempre seguras</li>
                </ul>
              `}
            </div>

            ${!isResetRequest ? `
              <!-- Dicas de segurança -->
              <div style="margin-bottom: 32px;">
                <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🔐 Dicas de segurança:</h3>
                <ol style="color: #666666; padding-left: 20px; margin: 0;">
                  <li style="margin-bottom: 8px;"><strong>Nunca compartilhe</strong> sua senha com terceiros</li>
                  <li style="margin-bottom: 8px;"><strong>Use senhas únicas</strong> para cada serviço</li>
                  <li style="margin-bottom: 8px;"><strong>Ative a autenticação</strong> em duas etapas quando disponível</li>
                  <li style="margin-bottom: 8px;"><strong>Verifique regularmente</strong> sua atividade na conta</li>
                </ol>
              </div>
            ` : ''}

            <!-- Botões de ação -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${req.headers.get("origin")}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #8B5A3C, #A0522D); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px 8px;">
                🏠 Acessar Dashboard
              </a>
              <br>
              <a href="${req.headers.get("origin")}/settings" 
                 style="display: inline-block; background-color: transparent; color: #8B5A3C; padding: 12px 24px; text-decoration: none; border: 2px solid #8B5A3C; border-radius: 8px; font-weight: 600; margin: 0 8px;">
                ⚙️ Configurações de Segurança
              </a>
            </div>

            <!-- Links de suporte -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-bottom: 24px;">
              <h4 style="color: #1F1F1F; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🆘 Precisa de ajuda?</h4>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li><a href="${req.headers.get("origin")}/legal/support" style="color: #8B5A3C; text-decoration: none;">Central de Ajuda</a></li>
                <li><a href="mailto:security@ordomo.com" style="color: #8B5A3C; text-decoration: none;">Reportar problema de segurança</a></li>
                <li><a href="https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20ajuda%20com%20segurança." style="color: #8B5A3C; text-decoration: none;">Suporte via WhatsApp</a></li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 24px; color: #666666; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                Este é um email automático de segurança. Não responda este email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                <strong>Ordomo</strong> - Gestão inteligente de hospedagem
                <br>
                <a href="${req.headers.get("origin")}/legal/privacy" style="color: #8B5A3C; text-decoration: none;">Política de Privacidade</a> | 
                <a href="${req.headers.get("origin")}/legal/terms" style="color: #8B5A3C; text-decoration: none;">Termos de Uso</a>
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
    logStep("ERROR in send-password-reset-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});