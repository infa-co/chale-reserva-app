const monthNames: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julh: 7, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const wordNumbers: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
  catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18,
  dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  cem: 100, cento: 100, duzentos: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
  mil: 1000,
};

export const parseDateFromSpeech = (text: string): string | null => {
  const normalized = text.toLowerCase().trim();

  // Try "dd/mm/yyyy" or "dd-mm-yyyy"
  const slashMatch = normalized.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{2,4})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]);
    let year = parseInt(slashMatch[3]);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Try "15 de março de 1990" or "quinze de março"
  for (const [name, monthNum] of Object.entries(monthNames)) {
    const regex = new RegExp(`(\\d+|[a-záéíóúãõê]+)\\s+de\\s+${name}(?:\\s+de\\s+(\\d{2,4}))?`);
    const match = normalized.match(regex);
    if (match) {
      let day = parseInt(match[1]);
      if (isNaN(day)) day = wordNumbers[match[1]] || 0;
      if (day < 1 || day > 31) continue;

      let year = match[2] ? parseInt(match[2]) : new Date().getFullYear();
      if (year < 100) year += 2000;

      return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Try just numbers "15 03 1990"
  const numMatch = normalized.match(/(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/);
  if (numMatch) {
    const day = parseInt(numMatch[1]);
    const month = parseInt(numMatch[2]);
    let year = parseInt(numMatch[3]);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
};

export const parseValueFromSpeech = (text: string): number | null => {
  const normalized = text.toLowerCase().replace(/reais|real|r\$/g, '').trim();

  // Try direct number: "350" or "350,50"
  const directMatch = normalized.match(/(\d+)[,.]?(\d*)/);
  if (directMatch) {
    const intPart = directMatch[1];
    const decPart = directMatch[2] || '0';
    return parseFloat(`${intPart}.${decPart}`);
  }

  // Try word-based: "trezentos e cinquenta"
  let total = 0;
  let current = 0;
  const words = normalized.replace(/\s+e\s+/g, ' ').split(/\s+/);

  for (const word of words) {
    const val = wordNumbers[word];
    if (val !== undefined) {
      if (val === 1000) {
        current = current === 0 ? 1000 : current * 1000;
      } else if (val >= 100) {
        current += val;
      } else {
        current += val;
      }
    }
  }
  total += current;

  return total > 0 ? total : null;
};
