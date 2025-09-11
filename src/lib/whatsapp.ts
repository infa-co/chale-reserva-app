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

  const useAsciiFallback = !!options?.asciiFallback;

  if (useAsciiFallback) {
    // Normalize and aggressively replace problematic characters/emojis with '-'
    // Replace known problematic bullets and the replacement char
    sanitized = sanitized
      .replace(/[\uFFFD]/g, '-') // corrupted replacement char
      .replace(/[▪▫◾◽◼◻🔹🔸✔️✅☑️✳️✴️❗️❕•●○◦]/g, '-')
      .replace(/[📅🗓️🏠🛏️💰✅📋📞🧹🗑️✨🎉🔥💡🚗🎯📈🎊🌟⭐🎈🎁🏆🎖️🥇🏅🎪🎭🎨🎬📱💻⚡🔔📢📣🎵🎶🎤🎧🎸🥳😍😊😉😎🤩🥰😘😗🤗🤝👏👍👌✌️🤞🙏💪💯❤️💖💕💗💓💜💙💚🧡💛🤍🖤❣️💝💐🌹🌸🌺🌻🌷⚘🛡️🔑🚪🛁🚿🍽️☕🧊🎮📺🔌💡🌡️❄️🔥🌊🏔️🌲🦎🐛🌙☀️⛈️🌈]/g, '-')
      // Remove variation selectors and zero-width joiners that break rendering
      .replace(/[\uFE00-\uFE0F\u200D\u20E3]/g, '');

    // Replace any remaining emoji code points with '-'
    sanitized = sanitized
      .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '-');

    // Collapse repeated dashes and ensure space after dash at line starts
    sanitized = sanitized
      .replace(/-+/g, '-')
      .replace(/(^|\n)\s*-\s*/g, '$1- ');
  }

  // Replace bullet points with dashes for better compatibility in all modes
  sanitized = sanitized.replace(/•/g, '-');

  // Normalize line breaks
  sanitized = sanitized.replace(/\r\n|\r/g, '\n');

  // Normalize special spaces and zero-width characters
  sanitized = sanitized
    .replace(/\u00A0/g, ' ') // non-breaking space
    .replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // various thin/zero spaces
    .replace(/[\u2060\uFEFF]/g, ''); // word joiner and BOM

  // Remove any lone surrogate halves to prevent URI encoding errors
  // - Low surrogates without a preceding high surrogate
  sanitized = sanitized.replace(/[\uDC00-\uDFFF]/g, '');
  // - High surrogates not followed by a low surrogate
  sanitized = sanitized.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');

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
  
  // Auto-detect if we need ASCII fallback due to replacement chars or problematic bullets
  const problematicBullets = /[▪▫◾◽◼◻🔹🔸✔️✅☑️✳️✴️❗️❕]/u;
  const needsAsciiFallback = asciiFallback || message.includes('�') || problematicBullets.test(message);
  
  const sanitizedMessage = sanitizeMessage(message, { asciiFallback: needsAsciiFallback });

  // Safe encode with fallback to pure ASCII
  let encodedMessage: string;
  try {
    encodedMessage = encodeURIComponent(sanitizedMessage);
  } catch (e) {
    const asciiOnly = sanitizeMessage(sanitizedMessage, { asciiFallback: true }).replace(/[^\x00-\x7F]/g, '');
    try {
      encodedMessage = encodeURIComponent(asciiOnly);
    } catch {
      encodedMessage = '';
    }
  }
  
  return `https://wa.me/${normalizedPhone}${sanitizedMessage ? `?text=${encodedMessage}` : ''}`;
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