
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { FeatureRestriction } from '@/components/FeatureRestriction';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { toast } from 'sonner';
import { sanitizeString, sanitizePhone, sanitizeCPF } from '@/lib/validation';

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
        <Input
          id="guestName"
          value={formData.guestName}
          onChange={(e) => onInputChange('guestName', sanitizeString(e.target.value))}
          placeholder="Nome completo"
          className="mt-1"
          maxLength={100}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', sanitizePhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="mt-1"
            maxLength={20}
          />
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
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', sanitizeString(e.target.value))}
          placeholder="email@exemplo.com"
          className="mt-1"
          maxLength={255}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onInputChange('city', sanitizeString(e.target.value))}
            placeholder="São Paulo"
            className="mt-1"
            maxLength={100}
          />
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
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => onInputChange('birthDate', e.target.value)}
            className="mt-1"
            max={new Date().toISOString().split('T')[0]}
          />
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
