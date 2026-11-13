import { parseDateOnly, todayDateOnly, toDateOnlyString } from '@/lib/dates';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { useStayConflict } from '@/hooks/useStayConflict';
import { conflictMessage } from '@/lib/bookingConflicts';
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
  const externalId = searchParams.get('external');
  const [externalSource, setExternalSource] = useState<{ id: string; uid: string; platform: string } | null>(null);
  
  const { addBooking, bookings } = useBookings();
  const { formData, handleInputChange, calculateNights, openWhatsApp } = useBookingForm(propertyIdFromUrl || undefined);
  const { checkDateConflict, validateBookingData } = useBookingValidation();
  const stayConflict = useStayConflict(formData.propertyId, formData.checkIn, formData.checkOut, undefined, externalSource?.id);
  const blockedByConflict = stayConflict.checking || stayConflict.invalidDates || stayConflict.conflicts.length > 0;
  const { checkBookingLimit, limits } = usePlanRestrictions();

  const [warnings, setWarnings] = useState<string[]>([]);

  // Registering the guest of a reservation imported from Airbnb (or another calendar):
  // start from its chalé and dates, and keep its UID so the import stops listing it apart.
  useEffect(() => {
    if (!externalId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('external_bookings')
        .select('id, external_id, platform_name, start_date, end_date, ical_syncs!inner(property_id)')
        .eq('id', externalId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error('Não encontrei essa reserva externa. Ela pode ter sido cancelada na plataforma.');
        return;
      }
      const propertyId = (data as any).ical_syncs?.property_id as string | null;
      if (propertyId) handleInputChange('propertyId', propertyId);
      handleInputChange('checkIn', data.start_date);
      handleInputChange('checkOut', data.end_date);
      handleInputChange('notes', `Reserva via ${data.platform_name}`);
      setExternalSource({ id: data.id, uid: data.external_id, platform: data.platform_name });
    })();
    return () => {
      cancelled = true;
    };
    // handleInputChange only wraps a state setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalId]);
  const [errors, setErrors] = useState<string[]>([]);
  const [forceSubmit, setForceSubmit] = useState(false);

  // Verificar limite de reservas do mês atual
  const currentMonthBookingCount = bookings.filter(booking => {
    const checkIn = parseDateOnly(booking.check_in);
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

    if (stayConflict.invalidDates) newErrors.push('O check-out precisa ser depois do check-in (mínimo 1 noite)');
    stayConflict.conflicts.forEach((c) => newErrors.push(conflictMessage(c)));

    // Soft warnings
    if (!formData.phone.trim()) newWarnings.push('Telefone não preenchido');
    if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) newWarnings.push('Valor total não informado');
    if (!formData.paymentMethod.trim()) newWarnings.push('Método de pagamento não selecionado');

    return { errors: newErrors, warnings: newWarnings };
  };

  const doSubmit = async () => {
    const nights = calculateNights();

    try {
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
      notes: formData.notes?.trim() || undefined,
      ...(externalSource ? { external_uid: externalSource.uid, external_platform: externalSource.platform } : {})
      });
    } catch {
      // Not saved (the hook already explained why); stay on the form so nothing is lost.
      return;
    }

    if (externalSource) {
      // The dates now live in the Ordomo booking; drop the imported copy. If this fails the
      // next calendar sync removes it anyway, because the booking carries the reservation's UID.
      await supabase.from('external_bookings').delete().eq('id', externalSource.id);
    }

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
    if (newErrors.length > 0 || blockedByConflict) return;
    
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

      {externalSource && (
        <Alert className="mb-6 border-orange-300 bg-orange-50 text-orange-900">
          <AlertDescription>
            Você está registrando o hóspede de uma reserva do {externalSource.platform}. O chalé e as datas já vieram do calendário.
          </AlertDescription>
        </Alert>
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
          conflict={stayConflict}
          allowPastDates={!!externalSource}
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
                disabled={blockedByConflict}
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
            disabled={blockedByConflict}
          >
            Salvar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
