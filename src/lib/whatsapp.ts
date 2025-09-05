export const normalizePhone = (phone: string): string => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Remove duplicate country codes (55)
  if (cleanPhone.startsWith('5555')) {
    return cleanPhone.substring(2); // Remove the first 55
  }
  
  // Ensure it starts with 55 (Brazil)
  if (!cleanPhone.startsWith('55')) {
    return `55${cleanPhone}`;
  }
  
  return cleanPhone;
};

export const sanitizeMessage = (message: string, options?: { asciiFallback?: boolean }): string => {
  let sanitized = message;
  
  if (options?.asciiFallback) {
    // Replace common emojis and symbols with ASCII equivalents
    sanitized = sanitized
      .replace(/📅/g, '[Data]')
      .replace(/🏠/g, '[Casa]')
      .replace(/💰/g, '[Valor]')
      .replace(/✅/g, '[Confirmado]')
      .replace(/📋/g, '[Info]')
      .replace(/📞/g, '[Telefone]')
      .replace(/✨/g, '*')
      .replace(/🎉/g, '!')
      .replace(/🔥/g, '[Hot]')
      .replace(/💡/g, '[Dica]')
      .replace(/🚗/g, '[Carro]')
      .replace(/🎯/g, '[Meta]')
      .replace(/📈/g, '[Crescimento]')
      .replace(/🎊/g, '!')
      .replace(/🌟/g, '*')
      .replace(/⭐/g, '*')
      .replace(/🎈/g, '')
      .replace(/🎁/g, '[Presente]')
      .replace(/🏆/g, '[Premio]')
      .replace(/🎖️/g, '[Medal]')
      .replace(/🥇/g, '[1º]')
      .replace(/🏅/g, '[Medal]')
      .replace(/🎪/g, '[Evento]')
      .replace(/🎭/g, '[Show]')
      .replace(/🎨/g, '[Arte]')
      .replace(/🎬/g, '[Video]')
      .replace(/📱/g, '[App]')
      .replace(/💻/g, '[PC]')
      .replace(/⚡/g, '[Rapido]')
      .replace(/🔔/g, '[Notif]')
      .replace(/📢/g, '[Aviso]')
      .replace(/📣/g, '[Anuncio]')
      .replace(/🎵/g, '[Musica]')
      .replace(/🎶/g, '[Som]')
      .replace(/🎤/g, '[Mic]')
      .replace(/🎧/g, '[Fone]')
      .replace(/🎸/g, '[Guitarra]')
      .replace(/🥳/g, '!')
      .replace(/😍/g, ':)')
      .replace(/😊/g, ':)')
      .replace(/😉/g, ';)')
      .replace(/😎/g, 'B)')
      .replace(/🤩/g, ':D')
      .replace(/🥰/g, '<3')
      .replace(/😘/g, ':*')
      .replace(/😗/g, ':*')
      .replace(/🤗/g, ':)')
      .replace(/🤝/g, '[Acordo]')
      .replace(/👏/g, '[Aplauso]')
      .replace(/👍/g, '[Like]')
      .replace(/👌/g, '[OK]')
      .replace(/✌️/g, '[Paz]')
      .replace(/🤞/g, '[Sorte]')
      .replace(/🙏/g, '[Obrigado]')
      .replace(/💪/g, '[Forca]')
      .replace(/🔥/g, '[Top]')
      .replace(/💯/g, '[100%]')
      .replace(/❤️/g, '<3')
      .replace(/💖/g, '<3')
      .replace(/💕/g, '<3')
      .replace(/💗/g, '<3')
      .replace(/💓/g, '<3')
      .replace(/💜/g, '<3')
      .replace(/💙/g, '<3')
      .replace(/💚/g, '<3')
      .replace(/🧡/g, '<3')
      .replace(/💛/g, '<3')
      .replace(/🤍/g, '<3')
      .replace(/🖤/g, '<3')
      .replace(/❣️/g, '<3')
      .replace(/💝/g, '[Presente]')
      .replace(/💐/g, '[Flores]')
      .replace(/🌹/g, '[Rosa]')
      .replace(/🌸/g, '[Flor]')
      .replace(/🌺/g, '[Flor]')
      .replace(/🌻/g, '[Girassol]')
      .replace(/🌷/g, '[Tulipa]')
      .replace(/⚘/g, '[Flor]');
      
    // Remove variation selectors and other problematic Unicode sequences when using ASCII fallback
    sanitized = sanitized.replace(/[\uFE00-\uFE0F\u200D\u20E3]/g, '');
  } else {
    // Only remove variation selectors when NOT using ASCII fallback
    sanitized = sanitized.replace(/[\uFE00-\uFE0F]/g, '');
  }
  
  // Replace bullet points with dashes for better compatibility
  sanitized = sanitized.replace(/•/g, '-');
  
  // Normalize line breaks
  sanitized = sanitized.replace(/\r\n|\r/g, '\n');
  
  return sanitized;
};

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const getWhatsAppUrl = ({ 
  phone, 
  message = '', 
  asciiFallback = false 
}: { 
  phone: string; 
  message?: string; 
  asciiFallback?: boolean; 
}): string => {
  const normalizedPhone = normalizePhone(phone);
  
  // Auto-detect if we need ASCII fallback due to  characters
  const needsAsciiFallback = asciiFallback || message.includes('');
  
  const sanitizedMessage = sanitizeMessage(message, { asciiFallback: needsAsciiFallback });
  const encodedMessage = encodeURIComponent(sanitizedMessage);
  
  return `https://wa.me/${normalizedPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

export const openWhatsApp = ({ 
  phone, 
  message = '', 
  asciiFallback = false 
}: { 
  phone: string; 
  message?: string; 
  asciiFallback?: boolean; 
}): boolean => {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    // Validate phone number (should have at least 12-13 digits: 55 + DDD + number)
    if (normalizedPhone.length < 12) {
      console.warn('Número de telefone muito curto:', normalizedPhone);
      alert('Número de telefone inválido. Verifique se o número está completo.');
      return false;
    }
    
    const whatsappUrl = getWhatsAppUrl({ phone: normalizedPhone, message, asciiFallback });
    
    console.info('WhatsApp URL:', whatsappUrl);
    console.info('Telefone normalizado:', normalizedPhone);
    
    // Try to open WhatsApp
    const newWindow = window.open(whatsappUrl, '_blank');
    
    // If blocked, provide fallback
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback: copy message and show instructions
      if (message) {
        const sanitizedMessage = sanitizeMessage(message, { asciiFallback });
        navigator.clipboard.writeText(sanitizedMessage).then(() => {
          alert(`WhatsApp bloqueado pelo navegador.\n\nMensagem copiada!\nAbra o WhatsApp manualmente e cole para: +${normalizedPhone}`);
        }).catch(() => {
          alert(`WhatsApp bloqueado pelo navegador.\n\nCopie esta mensagem:\n\n${sanitizedMessage}\n\nPara: +${normalizedPhone}`);
        });
      } else {
        alert(`WhatsApp bloqueado pelo navegador.\n\nAbra manualmente para: +${normalizedPhone}`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error);
    
    // Fallback: copy message
    if (message) {
      try {
        const sanitizedMessage = sanitizeMessage(message, { asciiFallback });
        navigator.clipboard.writeText(sanitizedMessage);
        alert('Erro ao abrir WhatsApp. Mensagem copiada para a área de transferência.');
      } catch (clipboardError) {
        alert(`Erro ao abrir WhatsApp. Copie esta mensagem manualmente:\n\n${sanitizeMessage(message, { asciiFallback })}`);
      }
    } else {
      alert('Erro ao abrir WhatsApp. Verifique se o número está correto.');
    }
    return false;
  }
};