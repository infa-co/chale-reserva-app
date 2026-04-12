import { parseDateFromSpeech, parseValueFromSpeech } from './voiceParsers';

interface ParsedBooking {
  guestName?: string;
  phone?: string;
  email?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  totalValue?: string;
  paymentMethod?: string;
  notes?: string;
}

const paymentKeywords: Record<string, string> = {
  'pix': 'pix',
  'picks': 'pix',
  'pics': 'pix',
  'crédito': 'credit',
  'credito': 'credit',
  'cartão de crédito': 'credit',
  'débito': 'debit',
  'debito': 'debit',
  'cartão de débito': 'debit',
  'dinheiro': 'cash',
  'transferência': 'transfer',
  'transferencia': 'transfer',
  'sinal': 'deposit',
  'depósito': 'deposit',
  'deposito': 'deposit',
};

/**
 * Parses a full booking dictation into structured fields.
 * 
 * Expected patterns (flexible order):
 * - "reserva para João Silva"
 * - "telefone 11 99999 9999"
 * - "check-in 15 de março" / "entrada dia 15 de março"
 * - "check-out 18 de março" / "saída dia 18 de março"
 * - "valor 500 reais" / "total 500"
 * - "pagamento pix" / "pix" / "cartão de crédito"
 * - "observação: ..." / "nota: ..."
 */
export const parseFullBookingFromSpeech = (text: string): ParsedBooking => {
  const result: ParsedBooking = {};
  const normalized = text.toLowerCase().trim();

  // --- Guest Name ---
  // "reserva para João Silva" or "nome João Silva" or "hóspede João Silva"
  const namePatterns = [
    /(?:reserva\s+(?:para|pro|pra)|nome|h[oó]spede|cliente)\s+(.+?)(?:\s+telefone|\s+check|\s+entrada|\s+valor|\s+total|\s+pagamento|\s+pix|\s+observa|\s+nota|$)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Capitalize first letter of each word
      result.guestName = match[1].trim().replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  // --- Phone ---
  // "telefone 11 99999 9999" or just a phone-like sequence
  const phoneMatch = normalized.match(/(?:telefone|fone|celular|whatsapp)\s*([\d\s\-().]+)/);
  if (phoneMatch) {
    result.phone = phoneMatch[1].replace(/\s+/g, '').replace(/[^\d]/g, '');
  }

  // --- Check-in ---
  const checkInPatterns = [
    /(?:check[\s-]?in|entrada|chega(?:da)?)\s+(?:dia\s+)?(.+?)(?:\s+check|\s+sa[ií]da|\s+valor|\s+total|\s+pagamento|\s+pix|\s+observa|\s+nota|$)/i,
  ];
  for (const pattern of checkInPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const parsed = parseDateFromSpeech(match[1].trim());
      if (parsed) {
        result.checkIn = parsed;
        break;
      }
    }
  }

  // --- Check-out ---
  const checkOutPatterns = [
    /(?:check[\s-]?out|sa[ií]da)\s+(?:dia\s+)?(.+?)(?:\s+valor|\s+total|\s+pagamento|\s+pix|\s+cr[eé]dito|\s+d[eé]bito|\s+dinheiro|\s+transfer|\s+sinal|\s+observa|\s+nota|$)/i,
  ];
  for (const pattern of checkOutPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const dateText = match[1].trim();
      let parsed = parseDateFromSpeech(dateText);
      // If just a day number, infer same month as check-in
      if (!parsed && result.checkIn) {
        const dayMatch = dateText.match(/^(\d{1,2})$/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          if (day >= 1 && day <= 31) {
            const ciMonth = result.checkIn.substring(5, 7);
            const ciYear = result.checkIn.substring(0, 4);
            parsed = `${ciYear}-${ciMonth}-${String(day).padStart(2, '0')}`;
          }
        }
      }
      if (parsed) {
        result.checkOut = parsed;
        break;
      }
    }
  }

  // --- Value ---
  const valueMatch = normalized.match(/(?:valor|total)\s+(?:de\s+)?(.+?)(?:\s+pagamento|\s+pix|\s+cr[eé]dito|\s+d[eé]bito|\s+dinheiro|\s+transfer|\s+sinal|\s+observa|\s+nota|$)/);
  if (valueMatch) {
    const parsed = parseValueFromSpeech(valueMatch[1].trim());
    if (parsed !== null) {
      result.totalValue = String(parsed);
    }
  }

  // --- Payment Method ---
  // Check longest keywords first
  const sortedKeywords = Object.keys(paymentKeywords).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (normalized.includes(keyword)) {
      result.paymentMethod = paymentKeywords[keyword];
      break;
    }
  }

  // --- Notes ---
  const notesMatch = text.match(/(?:observa[çc][aã]o|nota|obs)\s*:?\s*(.+)$/i);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
  }

  return result;
};

/**
 * Returns a summary of which fields were filled from voice input.
 */
export const getFilledFieldsSummary = (parsed: ParsedBooking): string[] => {
  const filled: string[] = [];
  if (parsed.guestName) filled.push('Nome');
  if (parsed.phone) filled.push('Telefone');
  if (parsed.checkIn) filled.push('Check-in');
  if (parsed.checkOut) filled.push('Check-out');
  if (parsed.totalValue) filled.push('Valor');
  if (parsed.paymentMethod) filled.push('Pagamento');
  if (parsed.notes) filled.push('Observações');
  return filled;
};
