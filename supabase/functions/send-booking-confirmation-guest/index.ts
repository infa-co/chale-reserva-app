import { ownedBookingRecipient, formatBookingDate } from "../_shared/security.ts";
import { safeLog, trustedOrigin, escapeHtml } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => safeLog("SEND-BOOKING-CONFIRMATION-GUEST", step, details);

interface BookingConfirmationRequest {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalValue: number;
  notes?: string;
  hostPhone?: string;
}

const validateBookingConfirmationInput = (data: any): BookingConfirmationRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Request body must be an object');
  }

  const { guestEmail, guestName, propertyName, checkIn, checkOut, nights, totalValue, notes, hostPhone } = data;

  if (!guestEmail || typeof guestEmail !== 'string' || !guestEmail.includes('@')) {
    throw new Error('guestEmail is required and must be a valid email');
  }

  if (!guestName || typeof guestName !== 'string' || guestName.trim().length === 0) {
    throw new Error('guestName is required');
  }

  if (!propertyName || typeof propertyName !== 'string') {
    throw new Error('propertyName is required');
  }

  if (!checkIn || !checkOut) {
    throw new Error('checkIn and checkOut are required');
  }

  if (!nights || typeof nights !== 'number' || nights <= 0) {
    throw new Error('nights must be a positive number');
  }

  if (typeof totalValue !== 'number' || totalValue < 0) {
    throw new Error('totalValue must be a non-negative number');
  }

  return {
    guestEmail: guestEmail.trim().toLowerCase(),
    guestName: guestName.trim(),
    propertyName: propertyName.trim(),
    checkIn,
    checkOut,
    nights,
    totalValue,
    notes: notes?.trim() || '',
    hostPhone: hostPhone?.trim() || ''
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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const user = userData.user;
    if (!user) {
      throw new Error("User not found");
    }
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    if (typeof body.bookingId !== 'string') return new Response(JSON.stringify({ error: 'bookingId obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const ownedClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: booking, error: bookingError } = await ownedClient.from('bookings').select('*').eq('id', body.bookingId).eq('user_id', user.id).single();
    if (bookingError || !booking) return new Response(JSON.stringify({ error: 'Reserva indisponível' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const guestEmail = ownedBookingRecipient(booking, user.id);
    const { data: property } = await ownedClient.from('properties').select('name').eq('id', booking.property_id ?? '').eq('user_id', user.id).maybeSingle();
    const { guestName, propertyName, checkIn, checkOut, nights, totalValue, notes, hostPhone } = validateBookingConfirmationInput({
      guestEmail, guestName: booking.guest_name, propertyName: property?.name || 'Propriedade', checkIn: booking.check_in, checkOut: booking.check_out,
      nights: booking.nights, totalValue: Number(booking.total_value), notes: booking.notes || '', hostPhone: ''
    });
    const checkInDate = formatBookingDate(checkIn);
    const checkOutDate = formatBookingDate(checkOut);

    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(totalValue);

    const { error: emailError, data: emailData } = await resend.emails.send({
      from: "Ordomo <reservas@ordomo.com.br>",
      to: [guestEmail],
      subject: `✅ Confirmação de Reserva - ${propertyName.replace(/[\r\n]/g, " ")}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmação de Reserva - Ordomo</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Reserva Confirmada!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Olá ${escapeHtml(guestName)},</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Sua reserva foi confirmada com sucesso! 🎉 Estamos ansiosos para recebê-lo(a).
              </p>

              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 5px;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📋 Detalhes da Reserva</h2>
                <p style="margin: 8px 0;"><strong>Propriedade:</strong> ${escapeHtml(propertyName)}</p>
                <p style="margin: 8px 0;"><strong>Check-in:</strong> ${checkInDate}</p>
                <p style="margin: 8px 0;"><strong>Check-out:</strong> ${checkOutDate}</p>
                <p style="margin: 8px 0;"><strong>Noites:</strong> ${nights}</p>
                <p style="margin: 8px 0;"><strong>Valor Total:</strong> ${formattedValue}</p>
              </div>

              ${notes ? `
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 30px 0;">
                  <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #856404;">📝 Observações Importantes:</h3>
                  <p style="margin: 0; font-size: 14px; color: #856404; white-space: pre-line;">${escapeHtml(notes)}</p>
                </div>
              ` : ''}

              <h3 style="color: #667eea; margin-top: 30px; margin-bottom: 15px;">📍 Informações Importantes</h3>
              
              <ul style="list-style: none; padding: 0; margin: 20px 0;">
                <li style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  🕐 <strong>Check-in:</strong> Geralmente a partir das 14h00
                </li>
                <li style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  🕐 <strong>Check-out:</strong> Até às 12h00
                </li>
                <li style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  🗝️ <strong>Instruções de entrada:</strong> Serão enviadas próximo à data do check-in
                </li>
                <li style="padding: 10px 0;">
                  📱 <strong>Documentos:</strong> Por favor, tenha em mãos um documento de identificação válido
                </li>
              </ul>

              ${hostPhone ? `
                <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 5px; padding: 15px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e7d32;">
                    <strong>💬 Contato do Anfitrião</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                    WhatsApp: <a href="https://wa.me/${hostPhone.replace(/\D/g, '')}" style="color: #2e7d32; font-weight: bold;">${escapeHtml(hostPhone)}</a>
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #2e7d32;">
                    Entre em contato para dúvidas ou informações adicionais
                  </p>
                </div>
              ` : ''}

              <h3 style="color: #667eea; margin-top: 30px; margin-bottom: 15px;">✨ Prepare-se para sua estadia:</h3>
              
              <ul style="font-size: 14px; margin-bottom: 30px;">
                <li style="margin: 8px 0;">✓ Confirme seu horário de chegada com antecedência</li>
                <li style="margin: 8px 0;">✓ Separe seus documentos pessoais</li>
                <li style="margin: 8px 0;">✓ Anote o endereço completo da propriedade</li>
                <li style="margin: 8px 0;">✓ Guarde o contato do anfitrião</li>
              </ul>

              <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 5px; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                  <strong>ℹ️ Lembrete:</strong> Você receberá mais informações sobre instruções de check-in e acesso à propriedade próximo à data da sua chegada.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Desejamos uma excelente estadia! Se tiver qualquer dúvida, não hesite em entrar em contato.
              </p>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Atenciosamente,<br>
                <strong>Equipe Ordomo</strong>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} Ordomo - Gestão Inteligente de Propriedades</p>
              <p style="margin: 5px 0;">Este é um email automático de confirmação de reserva</p>
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