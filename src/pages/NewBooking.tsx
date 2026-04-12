
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { BookingDatesFormWithValidation } from '@/components/forms/BookingDatesFormWithValidation';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';
import { PropertySelector } from '@/components/forms/PropertySelector';
import { PlanUpgradePrompt } from '@/components/PlanUpgradePrompt';
import { FullBookingVoiceButton } from '@/components/forms/FullBookingVoiceButton';

const NewBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyIdFromUrl = searchParams.get('property_id');
  
  const { addBooking, bookings } = useBookings();
  const { formData, handleInputChange, calculateNights, openWhatsApp } = useBookingForm(propertyIdFromUrl || undefined);
  const { checkDateConflict, validateBookingData } = useBookingValidation();
  const { checkBookingLimit, limits } = usePlanRestrictions();

  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [forceSubmit, setForceSubmit] = useState(false);

  // Verificar limite de reservas do mês atual
  const currentMonthBookingCount = bookings.filter(booking => {
    const checkIn = new Date(booking.check_in);
    const now = new Date();
    return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
  }).length;

  const canCreateBooking = checkBookingLimit(currentMonthBookingCount);

  const runValidation = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Blocking errors
    if (!formData.guestName.trim()) newErrors.push('Nome do hóspede é obrigatório');
    if (!formData.checkIn) newErrors.push('Data de check-in é obrigatória');
    if (!formData.checkOut) newErrors.push('Data de check-out é obrigatória');
    if (!formData.propertyId) newErrors.push('Selecione uma propriedade');

    if (formData.checkIn && formData.checkOut) {
      const dateConflict = checkDateConflict(formData.checkIn, formData.checkOut);
      if (dateConflict?.hasConflict && dateConflict.type === 'invalid_dates') {
        newErrors.push(dateConflict.message);
      } else if (dateConflict?.hasConflict && dateConflict.type === 'date_overlap') {
        newWarnings.push(dateConflict.message);
      }
    }

    // Soft warnings
    if (!formData.phone.trim()) newWarnings.push('Telefone não preenchido');
    if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) newWarnings.push('Valor total não informado');
    if (!formData.paymentMethod.trim()) newWarnings.push('Método de pagamento não selecionado');

    return { errors: newErrors, warnings: newWarnings };
  };

  const doSubmit = async () => {
    const nights = calculateNights();

    await addBooking({
      property_id: formData.propertyId,
      guest_name: formData.guestName.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      state: formData.state?.trim() || undefined,
      birth_date: formData.birthDate || undefined,
      cpf: formData.cpf || undefined,
      booking_date: formData.bookingDate,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      nights,
      total_value: parseFloat(formData.totalValue) || 0,
      payment_method: formData.paymentMethod || 'Não informado',
      status: formData.status,
      notes: formData.notes?.trim() || undefined
    });

    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateBooking) {
      toast.error(`Limite de ${limits.maxBookingsPerMonth} reservas/mês atingido`);
      return;
    }

    const { errors: newErrors, warnings: newWarnings } = runValidation();
    setErrors(newErrors);
    setWarnings(newWarnings);

    // Blocking errors always prevent submission
    if (newErrors.length > 0) return;

    // If there are warnings but user hasn't forced, show them
    if (newWarnings.length > 0 && !forceSubmit) return;

    await doSubmit();
  };

  const handleForceSubmit = async () => {
    // Re-check only blocking errors
    const { errors: newErrors } = runValidation();
    setErrors(newErrors);
    if (newErrors.length > 0) return;
    
    await doSubmit();
  };

  // Clear force submit and warnings when form changes
  const handleInputChangeWrapped = (field: string, value: string) => {
    handleInputChange(field, value);
    setForceSubmit(false);
    if (errors.length > 0 || warnings.length > 0) {
      setErrors([]);
      setWarnings([]);
    }
  };

  return (
    <div className="p-4">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-sage-800">Nova Reserva</h1>
        </div>
        <FullBookingVoiceButton
          onFieldsUpdate={handleInputChangeWrapped}
          disabled={!canCreateBooking}
        />
      </header>

      {!canCreateBooking && (
        <div className="mb-6">
          <PlanUpgradePrompt 
            feature="mais reservas"
            description={`Você atingiu o limite de ${limits.maxBookingsPerMonth} reservas este mês`}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6"
            style={{ opacity: canCreateBooking ? 1 : 0.6, pointerEvents: canCreateBooking ? 'auto' : 'none' }}>
        <PropertySelector
          value={formData.propertyId}
          onChange={(value) => handleInputChangeWrapped('propertyId', value)}
          required={true}
          autoSelectIfOne={true}
        />

        <GuestInfoForm
          formData={{
            guestName: formData.guestName,
            phone: formData.phone,
            email: formData.email,
            city: formData.city,
            state: formData.state,
            birthDate: formData.birthDate,
            cpf: formData.cpf
          }}
          onInputChange={handleInputChangeWrapped}
          onOpenWhatsApp={openWhatsApp}
        />

        <BookingDatesFormWithValidation
          formData={{
            bookingDate: formData.bookingDate,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut
          }}
          onInputChange={handleInputChangeWrapped}
          nights={calculateNights()}
        />

        <PaymentForm
          formData={{
            totalValue: formData.totalValue,
            paymentMethod: formData.paymentMethod,
            status: formData.status
          }}
          onInputChange={handleInputChangeWrapped}
        />

        <NotesForm
          notes={formData.notes}
          onInputChange={handleInputChangeWrapped}
        />

        {/* Inline validation messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm">{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && errors.length === 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1 mb-3">
                {warnings.map((warn, i) => (
                  <li key={i} className="text-sm">{warn}</li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={handleForceSubmit}
              >
                Salvar assim mesmo
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
