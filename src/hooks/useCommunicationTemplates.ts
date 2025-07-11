
import { Booking } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunicationTemplate {
  id: string;
  name: string;
  subject?: string;
  message: string;
  type: 'whatsapp' | 'email';
  category: 'confirmation' | 'reminder' | 'checkin' | 'checkout' | 'payment' | 'cancellation';
}

export const useCommunicationTemplates = () => {
  const templates: CommunicationTemplate[] = [
    {
      id: 'whatsapp_confirmation',
      name: 'Confirmação - WhatsApp',
      type: 'whatsapp',
      category: 'confirmation',
      message: `Olá {{guest_name}}! 🏡

✅ Sua reserva foi CONFIRMADA!

📅 Check-in: {{check_in_formatted}}
📅 Check-out: {{check_out_formatted}}
🛏️ {{nights}} noite(s)
💰 Total: R$ {{total_value}}

Estamos ansiosos para recebê-la(o)!

Qualquer dúvida, estarei aqui! 😊`
    },
    {
      id: 'whatsapp_reminder',
      name: 'Lembrete Check-in - WhatsApp',
      type: 'whatsapp',
      category: 'reminder',
      message: `Oi {{guest_name}}! 👋

Lembrete: seu check-in é AMANHÃ! 🗓️

⏰ Check-in: {{check_in_formatted}}
📍 Endereço será enviado às 14h
🔑 Check-in a partir das 15h

Mal podemos esperar para recebê-la(o)! ✨`
    },
    {
      id: 'whatsapp_checkin',
      name: 'Instruções Check-in - WhatsApp',
      type: 'whatsapp',
      category: 'checkin',
      message: `{{guest_name}}, chegou o dia! 🎉

🏡 SEU CHECK-IN É HOJE!

📍 Endereço: [INSERIR ENDEREÇO]
⏰ A partir das 15h
🔑 Código do portão: [INSERIR CÓDIGO]

Instruções detalhadas:
• Wifi: [INSERIR WIFI]
• Lixo: [INSERIR INSTRUÇÕES]
• Checkout: até 11h

Tenha uma estadia incrível! 🌟`
    },
    {
      id: 'whatsapp_payment',
      name: 'Cobrança Pagamento - WhatsApp',
      type: 'whatsapp',
      category: 'payment',
      message: `Oi {{guest_name}}! 😊

Só lembrando que temos uma reserva confirmada para {{check_in_formatted}} e o pagamento ainda está pendente.

💰 Valor: R$ {{total_value}}
📅 Check-in: {{check_in_formatted}}

Pix: [INSERIR PIX]
ou
Link de pagamento: [INSERIR LINK]

Assim que confirmado, envio todos os detalhes! ✨`
    },
    {
      id: 'email_confirmation',
      name: 'Confirmação - Email',
      type: 'email',
      category: 'confirmation',
      subject: 'Reserva Confirmada - {{guest_name}}',
      message: `Olá {{guest_name}},

Sua reserva foi confirmada com sucesso!

DETALHES DA RESERVA:
• Check-in: {{check_in_formatted}}
• Check-out: {{check_out_formatted}}
• Noites: {{nights}}
• Valor total: R$ {{total_value}}
• Forma de pagamento: {{payment_method}}

Enviaremos as instruções de check-in 1 dia antes da sua chegada.

Atenciosamente,
[NOME DO CHALÉ]`
    }
  ];

  const getTemplatesByCategory = (category: CommunicationTemplate['category']) => {
    return templates.filter(t => t.category === category);
  };

  const getTemplatesByType = (type: CommunicationTemplate['type']) => {
    return templates.filter(t => t.type === type);
  };

  const generateMessage = (templateId: string, booking: Booking, customVariables: Record<string, string> = {}) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';

    const variables = {
      guest_name: booking.guest_name,
      check_in_formatted: format(parseISO(booking.check_in), "dd/MM/yyyy (EEEE)", { locale: ptBR }),
      check_out_formatted: format(parseISO(booking.check_out), "dd/MM/yyyy (EEEE)", { locale: ptBR }),
      nights: booking.nights.toString(),
      total_value: booking.total_value.toLocaleString('pt-BR'),
      payment_method: booking.payment_method,
      phone: booking.phone,
      email: booking.email || '',
      city: booking.city || '',
      state: booking.state || '',
      ...customVariables
    };

    let message = template.message;
    let subject = template.subject || '';

    // Substituir variáveis
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    return {
      message,
      subject: subject || undefined,
      template
    };
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const generateEmailLink = (email: string, subject: string, message: string) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedMessage = encodeURIComponent(message);
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedMessage}`;
  };

  return {
    templates,
    getTemplatesByCategory,
    getTemplatesByType,
    generateMessage,
    openWhatsApp,
    generateEmailLink
  };
};
