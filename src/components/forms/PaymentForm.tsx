
import { DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Booking } from '@/types/booking';

interface PaymentFormProps {
  formData: {
    totalValue: string;
    paymentMethod: string;
    status: Booking['status'];
  };
  onInputChange: (field: string, value: string) => void;
}

export const PaymentForm = ({ formData, onInputChange }: PaymentFormProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <h3 className="font-semibold text-sage-800 flex items-center gap-2">
        <DollarSign size={18} />
        Pagamento
      </h3>
      
      <div>
        <Label htmlFor="totalValue">Valor Total *</Label>
        <Input
          id="totalValue"
          type="number"
          step="0.01"
          value={formData.totalValue}
          onChange={(e) => onInputChange('totalValue', e.target.value)}
          placeholder="0,00"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <Select value={formData.paymentMethod} onValueChange={(value) => onInputChange('paymentMethod', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="credit">Cartão de Crédito</SelectItem>
            <SelectItem value="debit">Cartão de Débito</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="transfer">Transferência</SelectItem>
            <SelectItem value="deposit">Sinal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status da Reserva</Label>
        <Select value={formData.status} onValueChange={(value: any) => onInputChange('status', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requested">Solicitada</SelectItem>
            <SelectItem value="pending">Aguardando Pagamento</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="checked_in">Check-in Realizado</SelectItem>
            <SelectItem value="active">Estadia Ativa</SelectItem>
            <SelectItem value="checked_out">Check-out Realizado</SelectItem>
            <SelectItem value="completed">Finalizada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
