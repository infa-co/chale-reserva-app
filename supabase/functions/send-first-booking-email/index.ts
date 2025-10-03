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
  console.log(`[FIRST-BOOKING-EMAIL] ${step}${detailsStr}`);
};

interface FirstBookingEmailRequest {
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalValue: string;
}

const validateFirstBookingEmailInput = (data: any): FirstBookingEmailRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { guestName, checkIn, checkOut, totalValue } = data;
  
  if (!guestName || typeof guestName !== 'string' || guestName.length > 100) {
    throw new Error('Invalid guest name');
  }
  
  if (!checkIn || typeof checkIn !== 'string') {
    throw new Error('Invalid check-in date');
  }
  
  if (!checkOut || typeof checkOut !== 'string') {
    throw new Error('Invalid check-out date');
  }
  
  if (!totalValue || typeof totalValue !== 'string' || totalValue.length > 20) {
    throw new Error('Invalid total value');
  }
  
  return { 
    guestName: guestName.trim(), 
    checkIn: checkIn.trim(), 
    checkOut: checkOut.trim(),
    totalValue: totalValue.trim()
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
    const { guestName, checkIn, checkOut, totalValue } = validateFirstBookingEmailInput(requestBody);

    // Get user profile for personalized greeting
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = profile?.name || user.email.split('@')[0];
    
    logStep("Sending first booking email", { to: user.email, guestName });

    const emailResponse = await resend.emails.send({
      from: "Ordomo <success@ordomo.com.br>",
      to: [user.email],
      subject: `🎉 Parabéns pela sua primeira reserva! - Ordomo`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Primeira Reserva</title>
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
                🎉 Parabéns, ${userName}!
              </h2>
              <p style="color: #666666; font-size: 16px; margin: 0;">
                Você acabou de criar sua <strong>primeira reserva</strong> no Ordomo! Este é um marco importante na sua jornada como gestor de hospedagem.
              </p>
            </div>

            <!-- Detalhes da primeira reserva -->
            <div style="background-color: #F0FDF4; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #10B981;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🏨 Detalhes da sua primeira reserva:</h3>
              <div style="margin-bottom: 16px;">
                <p style="margin: 4px 0; color: #666666;"><strong>Hóspede:</strong> ${guestName}</p>
                <p style="margin: 4px 0; color: #666666;"><strong>Check-in:</strong> ${checkIn}</p>
                <p style="margin: 4px 0; color: #666666;"><strong>Check-out:</strong> ${checkOut}</p>
                <p style="margin: 4px 0; color: #666666;"><strong>Valor:</strong> R$ ${totalValue}</p>
                <p style="margin: 4px 0; color: #666666;"><strong>Status:</strong> ✅ Confirmada</p>
              </div>
            </div>

            <!-- Dicas importantes -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">💡 Dicas para otimizar sua gestão:</h3>
              <ol style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Configure comunicações automáticas</strong> - Envie emails de confirmação, instruções de check-in e check-out</li>
                <li style="margin-bottom: 8px;"><strong>Sincronize com outras plataformas</strong> - Conecte com Airbnb, Booking.com para evitar conflitos</li>
                <li style="margin-bottom: 8px;"><strong>Organize seus templates</strong> - Crie mensagens padrão para WhatsApp e email</li>
                <li style="margin-bottom: 8px;"><strong>Acompanhe métricas</strong> - Use relatórios para entender seu desempenho</li>
              </ol>
            </div>

            <!-- Próximos passos recomendados -->
            <div style="background-color: #FEF3C7; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #F59E0B;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🚀 Próximos passos recomendados:</h3>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Explore os templates de comunicação</strong> - Automatize mensagens para seus hóspedes</li>
                <li style="margin-bottom: 8px;"><strong>Configure sincronização de calendários</strong> - Conecte suas plataformas externas</li>
                <li style="margin-bottom: 8px;"><strong>Cadastre mais propriedades</strong> - Expanda sua operação</li>
                <li style="margin-bottom: 8px;"><strong>Personalize suas configurações</strong> - Ajuste a plataforma às suas necessidades</li>
              </ul>
            </div>

            <!-- Recursos úteis -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1F1F1F; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🛠️ Recursos que podem te ajudar:</h3>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Central de Comunicação</strong> - Gerencie todos os contatos em um lugar</li>
                <li style="margin-bottom: 8px;"><strong>Relatórios de Ocupação</strong> - Acompanhe sua taxa de ocupação</li>
                <li style="margin-bottom: 8px;"><strong>Gestão de Clientes</strong> - Mantenha histórico de todos os hóspedes</li>
                <li style="margin-bottom: 8px;"><strong>Automações WhatsApp</strong> - Comunique-se rapidamente com os hóspedes</li>
              </ul>
            </div>

            <!-- Botões de ação -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${req.headers.get("origin")}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #8B5A3C, #A0522D); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px 8px;">
                📊 Ver Dashboard
              </a>
              <br>
              <a href="${req.headers.get("origin")}/comunicacao" 
                 style="display: inline-block; background-color: transparent; color: #8B5A3C; padding: 12px 24px; text-decoration: none; border: 2px solid #8B5A3C; border-radius: 8px; font-weight: 600; margin: 0 8px;">
                💬 Configurar Comunicações
              </a>
            </div>

            <!-- Mensagem motivacional -->
            <div style="background-color: #F3F4F6; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin: 0; font-style: italic;">
                "O sucesso na hospedagem começa com uma boa gestão. Você está no caminho certo!"
              </p>
              <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">
                - Equipe Ordomo
              </p>
            </div>

            <!-- Links úteis -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-bottom: 24px;">
              <h4 style="color: #1F1F1F; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🔗 Links úteis:</h4>
              <ul style="color: #666666; padding-left: 20px; margin: 0;">
                <li><a href="${req.headers.get("origin")}/legal/support" style="color: #8B5A3C; text-decoration: none;">Central de Ajuda</a></li>
                <li><a href="${req.headers.get("origin")}/properties" style="color: #8B5A3C; text-decoration: none;">Gerenciar Propriedades</a></li>
                <li><a href="https://wa.me/5511999999999?text=Olá!%20Criei%20minha%20primeira%20reserva%20no%20Ordomo!" style="color: #8B5A3C; text-decoration: none;">Compartilhar sucesso no WhatsApp</a></li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 24px; color: #666666; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                Estamos orgulhosos de fazer parte da sua jornada! Continue crescendo conosco.
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
    logStep("ERROR in send-first-booking-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});