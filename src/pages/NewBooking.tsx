
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

const NewBooking = () => {
  const navigate = useNavigate();
  const { addBooking } = useBookings();
  
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    bookingDate: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    totalValue: '',
    paymentMethod: '',
    status: 'confirmed' as const,
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = parseISO(formData.checkIn);
      const checkOut = parseISO(formData.checkOut);
      return Math.max(0, differenceInDays(checkOut, checkIn));
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.phone || !formData.checkIn || !formData.checkOut || !formData.totalValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const nights = calculateNights();
    if (nights <= 0) {
      toast.error('Data de saída deve ser posterior à data de entrada');
      return;
    }

    addBooking({
      guestName: formData.guestName,
      phone: formData.phone,
      email: formData.email || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      bookingDate: formData.bookingDate,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      nights,
      totalValue: parseFloat(formData.totalValue),
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes || undefined
    });

    toast.success('Reserva criada com sucesso!');
    navigate('/');
  };

  const openWhatsApp = () => {
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  return (
    <div className="p-4">
      <header className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-sage-800">Nova Reserva</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2">
            <CalendarIcon size={18} />
            Dados do Hóspede
          </h3>
          
          <div>
            <Label htmlFor="guestName">Nome do Hóspede *</Label>
            <Input
              id="guestName"
              value={formData.guestName}
              onChange={(e) => handleInputChange('guestName', e.target.value)}
              placeholder="Nome completo"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-6 px-3"
              onClick={openWhatsApp}
              disabled={!formData.phone}
            >
              <MessageCircle size={18} className="text-green-600" />
            </Button>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="São Paulo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="SP"
                className="mt-1"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2">
            <CalendarIcon size={18} />
            Datas e Período
          </h3>
          
          <div>
            <Label htmlFor="bookingDate">Data da Reserva</Label>
            <Input
              id="bookingDate"
              type="date"
              value={formData.bookingDate}
              onChange={(e) => handleInputChange('bookingDate', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="checkIn">Check-in *</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="checkOut">Check-out *</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {formData.checkIn && formData.checkOut && (
            <div className="bg-sage-50 p-3 rounded-lg">
              <p className="text-sm text-sage-700">
                <strong>{calculateNights()} noites</strong>
              </p>
            </div>
          )}
        </div>

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
              onChange={(e) => handleInputChange('totalValue', e.target.value)}
              placeholder="0,00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
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
            <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre a reserva..."
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-sage-600 hover:bg-sage-700"
          >
            Salvar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
