import { describe, expect, it } from 'vitest';
import { bookingErrorMessage, formatMoneyBR, isDateOnly, nightsBetween, todayInSaoPaulo, validateDraft } from '../../supabase/functions/_shared/bookingRules.ts';
import { extractLinkCode, isNo, isYes, maskPhone, normalizePhone, splitMessage, validMetaSignature } from '../../supabase/functions/_shared/whatsappText.ts';
import { planAllows } from '../../supabase/functions/_shared/planFeatures.ts';

describe('server booking rules', () => {
  it('accepts only real calendar dates', () => {
    expect(isDateOnly('2026-12-20')).toBe(true);
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('20/12/2026')).toBe(false);
    expect(isDateOnly(undefined)).toBe(false);
  });

  it('counts nights with the check-out day excluded', () => {
    expect(nightsBetween('2026-12-20', '2026-12-23')).toBe(3);
    expect(nightsBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('uses the São Paulo calendar day, not UTC', () => {
    // 01:30 UTC on the 13th is still the 12th in São Paulo (UTC-3).
    expect(todayInSaoPaulo(new Date('2026-11-13T01:30:00Z'))).toBe('2026-11-12');
  });

  it('says what is missing in a draft', () => {
    expect(validateDraft({ property_id: 'p', guest_name: 'Ana', check_in: '2026-12-20', check_out: '2026-12-23' })).toEqual([]);
    expect(validateDraft({ property_id: 'p', guest_name: 'Ana', check_in: '2026-12-23', check_out: '2026-12-23' })[0]).toContain('mínimo 1 noite');
    expect(validateDraft({ guest_name: ' ', check_in: 'x' })).toHaveLength(4);
    expect(validateDraft({ property_id: 'p', guest_name: 'Ana', check_in: '2026-12-20', check_out: '2026-12-23', total_value: -5 })).toHaveLength(1);
  });

  it('turns database errors into plain sentences', () => {
    expect(bookingErrorMessage({ code: '23P01' })).toContain('ocupado');
    expect(bookingErrorMessage({ code: 'ORD02', message: 'Seu plano permite até 15 reservas por mês.' })).toContain('15 reservas');
    expect(bookingErrorMessage({ code: 'XX000', message: 'internal detail' })).not.toContain('internal');
    expect(formatMoneyBR(1234.5)).toBe('R$ 1.234,50');
  });
});

describe('WhatsApp helpers', () => {
  it('reads confirmations strictly', () => {
    for (const yes of ['sim', 'Sim!', 'SIM', 'ok', 'Confirmo', 'pode confirmar', 'isso mesmo']) expect(isYes(yes)).toBe(true);
    for (const no of ['não', 'Nao', 'cancela', 'deixa pra lá']) expect(isNo(no)).toBe(true);
    // A correction is neither: it goes to the assistant instead of saving the old proposal.
    for (const other of ['sim, mas muda o valor pra 800', 'simone', 'não sei', 'ok e a outra?']) {
      expect(isYes(other)).toBe(false);
      expect(isNo(other)).toBe(false);
    }
  });

  it('finds the link code and normalizes numbers', () => {
    expect(extractLinkCode('Vincular Ordomo 1234 5678')).toBe('12345678');
    expect(extractLinkCode('Vincular Ordomo 12345678')).toBe('12345678');
    expect(extractLinkCode('meu telefone é 11999990000')).toBeNull();
    expect(normalizePhone('+55 (11) 98888-7777')).toBe('5511988887777');
    expect(maskPhone('5511988887777')).toBe('•••••••••7777');
  });

  it('splits long replies under the WhatsApp limit', () => {
    const parts = splitMessage(Array.from({ length: 900 }, (_, i) => `linha ${i}`).join('\n'));
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 3800)).toBe(true);
  });

  it('verifies the Meta webhook signature', async () => {
    const body = '{"object":"whatsapp_business_account"}';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hex = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(await validMetaSignature(body, `sha256=${hex}`, 'secret')).toBe(true);
    expect(await validMetaSignature(body + ' ', `sha256=${hex}`, 'secret')).toBe(false);
    expect(await validMetaSignature(body, `sha256=${hex}`, 'other')).toBe(false);
    expect(await validMetaSignature(body, null, 'secret')).toBe(false);
  });

  it('gates features by plan like the app does', () => {
    expect(planAllows('basic', 'whatsapp')).toBe(false);
    expect(planAllows('pro', 'whatsapp')).toBe(true);
    expect(planAllows('pro', 'icalImport')).toBe(false);
    expect(planAllows('premium', 'icalImport')).toBe(true);
    expect(planAllows('none', 'whatsapp')).toBe(false);
    expect(planAllows(null, 'whatsapp')).toBe(false);
  });
});
