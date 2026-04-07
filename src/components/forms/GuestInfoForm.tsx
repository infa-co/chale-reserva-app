
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { FeatureRestriction } from '@/components/FeatureRestriction';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { toast } from 'sonner';
import { sanitizeString, sanitizePhone, sanitizeCPF } from '@/lib/validation';
import { VoiceInputButton } from './VoiceInputButton';
import { parseDateFromSpeech } from '@/lib/voiceParsers';

interface GuestInfoFormProps {
  formData: {
    guestName: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    birthDate: string;
    cpf: string;
  };
  onInputChange: (field: string, value: string) => void;
  onOpenWhatsApp: () => void;
}

export const GuestInfoForm = ({ formData, onInputChange, onOpenWhatsApp }: GuestInfoFormProps) => {
  const { checkFeatureAccess } = usePlanRestrictions();
  
  const hasWhatsAppAccess = checkFeatureAccess('hasWhatsAppIntegration');
  
  const handleWhatsAppClick = () => {
    if (hasWhatsAppAccess) {
      onOpenWhatsApp();
    } else {
      toast.error("Mude para o plano Pro para liberar essa função");
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <h3 className="font-semibold text-sage-800 flex items-center gap-2">
        Dados do Hóspede
      </h3>
      
      <div>
        <Label htmlFor="guestName">Nome do Hóspede *</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="guestName"
            value={formData.guestName}
            onChange={(e) => onInputChange('guestName', sanitizeString(e.target.value))}
            placeholder="Nome completo"
            maxLength={100}
          />
          <VoiceInputButton
            fieldId="guestName"
            onResult={(text) => onInputChange('guestName', sanitizeString(text))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="phone">Telefone *</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', sanitizePhone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={20}
            />
            <VoiceInputButton
              fieldId="phone"
              onResult={(text) => onInputChange('phone', sanitizePhone(text.replace(/\s/g, '')))}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className={`mt-6 px-3 ${!hasWhatsAppAccess ? 'opacity-75' : ''}`}
          onClick={handleWhatsAppClick}
          disabled={!formData.phone}
        >
          <MessageCircle size={18} className={hasWhatsAppAccess ? "text-green-600" : "text-gray-400"} />
        </Button>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', sanitizeString(e.target.value))}
            placeholder="email@exemplo.com"
            maxLength={255}
          />
          <VoiceInputButton
            fieldId="email"
            onResult={(text) => onInputChange('email', sanitizeString(text.replace(/\s/g, '').toLowerCase()))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onInputChange('city', sanitizeString(e.target.value))}
              placeholder="São Paulo"
              maxLength={100}
            />
            <VoiceInputButton
              fieldId="city"
              onResult={(text) => onInputChange('city', sanitizeString(text))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => onInputChange('state', sanitizeString(e.target.value).toUpperCase())}
            placeholder="SP"
            className="mt-1"
            maxLength={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => onInputChange('birthDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <VoiceInputButton
              fieldId="birthDate"
              onResult={(text) => {
                const parsed = parseDateFromSpeech(text);
                if (parsed) {
                  onInputChange('birthDate', parsed);
                } else {
                  toast.info(`Não entendi a data: "${text}". Tente "15 de março de 1990".`);
                }
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => {
              const sanitized = sanitizeCPF(e.target.value);
              const value = sanitized.replace(/\D/g, '');
              const maskedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
              onInputChange('cpf', maskedValue);
            }}
            placeholder="000.000.000-00"
            className="mt-1"
            maxLength={14}
          />
        </div>
      </div>
    </div>
  );
};
