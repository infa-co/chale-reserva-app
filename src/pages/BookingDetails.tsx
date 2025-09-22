import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Copy, MessageCircle, Calendar, DollarSign, User, Phone, Mail, MapPin, FileText, Trash2, CreditCard, Cake, Home } from 'lucide-react';
import { useDuplicateBooking } from '@/hooks/useDuplicateBooking';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { openWhatsApp as openWhatsAppUtil, isInIframe, getWhatsAppUrl } from '@/lib/whatsapp';
import { FeatureRestriction } from '@/components/FeatureRestriction';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookingWorkflow } from '@/components/BookingWorkflow';
import { CommunicationTemplates } from '@/components/CommunicationTemplates';

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBookingById, deleteBooking, updateBooking } = useBookings();
  const { duplicateWithSuggestedDates } = useDuplicateBooking();
  const { getPropertyById } = useOptimizedProperties();
  
  const booking = id ? getBookingById(id) : undefined;
  const property = booking?.property_id ? getPropertyById(booking.property_id) : null;

  if (!booking) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-sage-800 mb-4">Reserva não encontrada</h1>
        <Button onClick={() => navigate('/reservas')} variant="outline">
          Voltar para lista
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'requested': return 'bg-gray-100 text-gray-700';
      case 'checked_in': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'checked_out': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-slate-100 text-slate-700';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Aguardando Pagamento';
      case 'cancelled': return 'Cancelada';
      case 'requested': return 'Solicitada';
      case 'checked_in': return 'Check-in Realizado';
      case 'active': return 'Estadia Ativa';
      case 'checked_out': return 'Check-out Realizado';
      case 'completed': return 'Finalizada';
      default: return status;
    }
  };

  const openWhatsApp = () => {
    if (booking.phone) {
      const message = `Olá ${booking.guest_name}! Confirmando sua reserva:\n\nCheck-in: ${format(parseISO(booking.check_in), "dd/MM/yyyy", { locale: ptBR })}\nCheck-out: ${format(parseISO(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}\nValor: R$ ${booking.total_value.toLocaleString('pt-BR')}\n\nQualquer dúvida, estarei aqui!`;
      
      if (isInIframe()) {
        const url = getWhatsAppUrl({ phone: booking.phone, message });
        window.open(url, '_blank');
      } else {
        openWhatsAppUtil({ phone: booking.phone, message });
      }
    }
  };

  const handleDelete = () => {
    deleteBooking(booking.id);
    toast.success('Reserva excluída com sucesso!');
    navigate('/reservas');
  };

  const handleEdit = () => {
    navigate(`/editar-reserva/${booking.id}`);
  };

  const handleDuplicate = () => {
    duplicateWithSuggestedDates(booking);
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-sage-800">{booking.guest_name}</h1>
          <span className={`status-badge ${getStatusColor(booking.status)} mt-1`}>
            {getStatusText(booking.status)}
          </span>
        </div>
      </header>

      <div className="space-y-4">
        {/* Workflow de Estados */}
        <BookingWorkflow booking={booking} />

        {/* Templates de Comunicação */}
        <CommunicationTemplates booking={booking} />

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2 mb-4">
            <User size={18} />
            Informações do Hóspede
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={16} className="text-muted-foreground" />
              <span className="font-medium">{booking.guest_name}</span>
            </div>

            {booking.property_id && (
              <div className="flex items-center gap-3">
                <Home size={16} className="text-muted-foreground" />
                <span>Chalé: {property ? property.name : 'Propriedade não encontrada'}</span>
              </div>
            )}
            
            {booking.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted-foreground" />
                <span>{booking.phone}</span>
                <FeatureRestriction
                  feature="hasWhatsAppIntegration"
                  featureName="acesso rápido ao WhatsApp"
                  description="Envie mensagens diretamente dos detalhes da reserva"
                  fallback={
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <MessageCircle size={14} className="text-gray-400 mr-1" />
                      WhatsApp
                    </Button>
                  }
                >
                  {isInIframe() ? (
                    <a
                      href={getWhatsAppUrl({ 
                        phone: booking.phone, 
                        message: `Olá ${booking.guest_name}! Confirmando sua reserva:\n\nCheck-in: ${format(parseISO(booking.check_in), "dd/MM/yyyy", { locale: ptBR })}\nCheck-out: ${format(parseISO(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}\nValor: R$ ${booking.total_value.toLocaleString('pt-BR')}\n\nQualquer dúvida, estarei aqui!`
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ml-auto"
                    >
                      <MessageCircle size={14} className="text-green-600 mr-1" />
                      WhatsApp
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openWhatsApp}
                      className="ml-auto"
                    >
                      <MessageCircle size={14} className="text-green-600 mr-1" />
                      WhatsApp
                    </Button>
                  )}
                </FeatureRestriction>
              </div>
            )}
            
            {booking.email && (
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-muted-foreground" />
                <span>{booking.email}</span>
              </div>
            )}
            
            {booking.city && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-muted-foreground" />
                <span>{booking.city}, {booking.state}</span>
              </div>
            )}

            {booking.birth_date && (
              <div className="flex items-center gap-3">
                <Cake size={16} className="text-muted-foreground" />
                <span>Nascimento: {format(parseISO(booking.birth_date), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}

            {booking.cpf && (
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-muted-foreground" />
                <span>CPF: {booking.cpf}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2 mb-4">
            <Calendar size={18} />
            Período da Reserva
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Check-in</p>
              <p className="font-semibold text-sage-800">
                {format(parseISO(booking.check_in), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(booking.check_in), "EEEE", { locale: ptBR })}
              </p>
            </div>
            
            <div className="text-center p-3 bg-danger/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Check-out</p>
              <p className="font-semibold text-sage-800">
                {format(parseISO(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(booking.check_out), "EEEE", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-sage-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total de noites</p>
              <p className="text-2xl font-bold text-sage-800">{booking.nights}</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Data da reserva</p>
              <p className="font-semibold text-sage-800">
                {format(parseISO(booking.booking_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(booking.booking_date), "EEEE", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2 mb-4">
            <DollarSign size={18} />
            Informações Financeiras
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Total</span>
              <span className="text-2xl font-bold text-sage-800">
                R$ {booking.total_value.toLocaleString('pt-BR')}
              </span>
            </div>
            
            {booking.payment_method && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Forma de Pagamento</span>
                <span className="font-medium">{booking.payment_method}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor por noite</span>
              <span className="font-medium">
                R$ {(booking.total_value / booking.nights).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h3 className="font-semibold text-sage-800 flex items-center gap-2 mb-3">
              <FileText size={18} />
              Observações
            </h3>
            <p className="text-muted-foreground">{booking.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-sage-800 mb-3">Ações</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleEdit}
            >
              <Edit size={16} />
              Editar
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDuplicate}
            >
              <Copy size={16} />
              Duplicar
            </Button>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full flex items-center gap-2">
              <Trash2 size={16} />
              Excluir Reserva
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Reserva</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BookingDetails;
