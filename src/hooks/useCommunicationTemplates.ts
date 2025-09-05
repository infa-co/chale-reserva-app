
import { Booking } from '@/types/booking';
import { Property } from '@/types/property';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

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
      id: 'email_confirmation',
      name: 'Confirmação',
      type: 'email',
      category: 'confirmation',
      subject: 'Reserva Confirmada - {{guest_name}}',
      message: `Olá {{guest_name}}!

Sua reserva foi confirmada com sucesso!

DETALHES DA RESERVA:
• Check-in: {{check_in_formatted}}
• Check-out: {{check_out_formatted}}
• Noites: {{nights}}
• Valor total: R$ {{total_value}}
• Forma de pagamento: {{payment_method}}

Enviaremos as instruções de check-in 1 dia antes da sua chegada.

Atenciosamente,
{{property_name}}`
    },
    {
      id: 'email_reminder',
      name: 'Lembrete Check-in',
      type: 'email',
      category: 'reminder',
      subject: 'Lembrete: Check-in Amanhã - {{guest_name}}',
      message: `Olá {{guest_name}}!

Lembrete: seu check-in é amanhã!

DETALHES:
• Check-in: {{check_in_formatted}}
• Endereço será enviado às 14h
• Check-in a partir das 15h

Mal podemos esperar para recebê-la(o)!

Atenciosamente,
{{property_name}}`
    },
    {
      id: 'email_checkin',
      name: 'Instruções Check-in',
      type: 'email',
      category: 'checkin',
      subject: 'Check-in Hoje - {{guest_name}}',
      message: `{{guest_name}}, chegou o dia!

SEU CHECK-IN É HOJE!

INFORMAÇÕES:
• Endereço: [INSERIR ENDEREÇO]
• Horário: a partir das 15h
• Código do portão: [INSERIR CÓDIGO]

INSTRUÇÕES DETALHADAS:
• Wifi: [INSERIR WIFI]
• Lixo: [INSERIR INSTRUÇÕES]
• Checkout: até 11h

Tenha uma estadia incrível!

Atenciosamente,
{{property_name}}`
    },
    {
      id: 'email_payment',
      name: 'Cobrança Pagamento',
      type: 'email',
      category: 'payment',
      subject: 'Pagamento Pendente - {{guest_name}}',
      message: `Olá {{guest_name}}!

Lembramos que temos uma reserva confirmada para {{check_in_formatted}} e o pagamento ainda está pendente.

DETALHES:
• Valor: R$ {{total_value}}
• Check-in: {{check_in_formatted}}

FORMAS DE PAGAMENTO:
• Pix: [INSERIR PIX]
• Link de pagamento: [INSERIR LINK]

Assim que confirmado, enviaremos todos os detalhes!

Atenciosamente,
{{property_name}}`
    },
    {
      id: 'email_checkout',
      name: 'Check-out',
      type: 'email',
      category: 'checkout',
      subject: 'Check-out Hoje - {{guest_name}}',
      message: `Olá {{guest_name}}!

Hoje é o dia do seu check-out!

INSTRUÇÕES DE SAÍDA:
• Horário: até 11h
• Deixe a casa organizada
• Deixe as chaves no local indicado
• Coloque o lixo na lixeira externa

Esperamos que tenha aproveitado sua estadia conosco.

Se puder nos ajudar com uma avaliação, ficaremos muito gratos!

Atenciosamente,
{{property_name}}`
    },
    {
      id: 'email_cancellation',
      name: 'Cancelamento',
      type: 'email',
      category: 'cancellation',
      subject: 'Cancelamento Confirmado - {{guest_name}}',
      message: `Olá {{guest_name}}!

Confirmamos o cancelamento da sua reserva:

DETALHES DA RESERVA CANCELADA:
• Check-in: {{check_in_formatted}}
• Check-out: {{check_out_formatted}}
• Noites: {{nights}}
• Valor total: R$ {{total_value}}

Sentimos muito pelo cancelamento e esperamos recebê-la(o) em uma próxima oportunidade.

Se houver reembolso devido, será processado conforme nossa política de cancelamento.

Atenciosamente,
{{property_name}}`
    }
  ];

  const getTemplatesByCategory = (category: CommunicationTemplate['category']) => {
    return templates.filter(t => t.category === category);
  };

  const getTemplatesByType = (type: CommunicationTemplate['type']) => {
    return templates.filter(t => t.type === type);
  };

  const generateMessage = (templateId: string, booking: Booking, customVariables: Record<string, string> = {}, selectedProperty?: Property) => {
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
      property_name: selectedProperty?.name || '[SELECIONE O CHALÉ]',
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

  const openWhatsApp = (phone: string, message: string, asciiFallback = false) => {
    return openWhatsAppUtil({ phone, message, asciiFallback });
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
