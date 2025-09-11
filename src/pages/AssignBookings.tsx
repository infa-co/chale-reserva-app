import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/contexts/BookingContext';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { Booking } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const AssignBookings = () => {
  const navigate = useNavigate();
  const { allBookings, updateBooking } = useBookings();
  const { properties, loading: propertiesLoading } = useOptimizedProperties();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Filtrar reservas sem property_id
  const unassignedBookings = allBookings.filter(booking => !booking.property_id);

  useEffect(() => {
    // Inicializar assignments com valores vazios
    const initialAssignments: Record<string, string> = {};
    unassignedBookings.forEach(booking => {
      initialAssignments[booking.id] = '';
    });
    setAssignments(initialAssignments);
  }, [unassignedBookings]);

  const handleAssignmentChange = (bookingId: string, propertyId: string) => {
    setAssignments(prev => ({
      ...prev,
      [bookingId]: propertyId
    }));
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    try {
      const assignmentsToSave = Object.entries(assignments).filter(([_, propertyId]) => propertyId);
      
      if (assignmentsToSave.length === 0) {
        toast.error('Selecione pelo menos um chalé para atribuir');
        return;
      }

      for (const [bookingId, propertyId] of assignmentsToSave) {
        await updateBooking(bookingId, { property_id: propertyId });
      }

      toast.success(`${assignmentsToSave.length} reserva(s) atribuída(s) com sucesso!`);
      navigate('/reservas');
    } catch (error) {
      console.error('Erro ao salvar atribuições:', error);
      toast.error('Erro ao salvar atribuições');
    } finally {
      setSaving(false);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.name} - ${property.location}` : '';
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;

  if (propertiesLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reservas')}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-sage-800">Atribuir Reservas aos Chalés</h1>
          <p className="text-sm text-muted-foreground">
            {unassignedBookings.length} reserva(s) sem chalé atribuído
          </p>
        </div>
      </div>

      {/* Summary Card */}
      {unassignedBookings.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              Resumo das Atribuições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{assignedCount}</span> de <span className="font-medium">{unassignedBookings.length}</span> reservas selecionadas
              </div>
              <Button
                onClick={handleSaveAssignments}
                disabled={assignedCount === 0 || saving}
                className="ml-4"
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Salvando...' : `Salvar (${assignedCount})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No properties warning */}
      {properties.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa cadastrar pelo menos um chalé antes de atribuir reservas.{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/meus-chales')}>
              Cadastre um chalé aqui
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {unassignedBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium text-sage-800 mb-2">
                Todas as reservas estão atribuídas!
              </h3>
              <p className="text-muted-foreground mb-4">
                Não há reservas pendentes de atribuição aos chalés.
              </p>
              <Button onClick={() => navigate('/reservas')}>
                Ver Todas as Reservas
              </Button>
            </CardContent>
          </Card>
        ) : (
          unassignedBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sage-800 text-base mb-1">
                          {booking.guest_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar size={14} />
                          <span>
                            {format(parseISO(booking.check_in), "dd/MM/yyyy", { locale: ptBR })} → {format(parseISO(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {booking.nights} noites
                          </Badge>
                        </div>
                        {booking.city && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin size={14} />
                            <span>{booking.city}, {booking.state}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sage-800">
                          R$ {booking.total_value.toLocaleString('pt-BR')}
                        </div>
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'outline'}
                          className="text-xs mt-1"
                        >
                          {booking.status === 'confirmed' ? 'Confirmada' : 
                           booking.status === 'pending' ? 'Aguardando' : 
                           booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:w-64">
                    <label className="text-sm font-medium text-sage-800 block mb-2">
                      Atribuir ao Chalé:
                    </label>
                    <Select
                      value={assignments[booking.id] || ''}
                      onValueChange={(value) => handleAssignmentChange(booking.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um chalé" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Users size={14} />
                              <span>{property.name}</span>
                              <span className="text-muted-foreground">- {property.location}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignBookings;