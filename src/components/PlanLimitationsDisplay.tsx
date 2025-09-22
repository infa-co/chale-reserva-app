import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePlanRestrictions } from "@/hooks/usePlanRestrictions";
import { useOptimizedBookings } from "@/hooks/useOptimizedBookings";
import { useOptimizedProperties } from "@/hooks/useOptimizedProperties";
import { CheckCircle, XCircle, Clock, Users, Building, Calendar } from "lucide-react";

export const PlanLimitationsDisplay = () => {
  const { currentPlan, limits, checkBookingLimit, checkPropertyLimit } = usePlanRestrictions();
  const { bookings } = useOptimizedBookings();
  const { properties } = useOptimizedProperties();

  // Calcular estatísticas atuais
  const currentMonth = new Date().toISOString().slice(0, 7);
  const bookingsThisMonth = bookings.filter(booking => 
    booking.check_in?.startsWith(currentMonth)
  ).length;

  const bookingLimitOk = checkBookingLimit(bookingsThisMonth);
  const propertyLimitOk = checkPropertyLimit(properties.length);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'basic': return 'Básico';
      case 'pro': return 'Pro';
      case 'premium': return 'Premium';
      default: return 'Desconhecido';
    }
  };

  const getBookingProgress = () => {
    if (limits.maxBookingsPerMonth === null) return 0; // unlimited
    return (bookingsThisMonth / limits.maxBookingsPerMonth) * 100;
  };

  const getPropertyProgress = () => {
    if (limits.maxProperties === null) return 0; // unlimited
    return (properties.length / limits.maxProperties) * 100;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status do Plano
          <Badge className={getPlanColor(currentPlan)}>
            {getPlanName(currentPlan)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Limitações de Reservas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Reservas (este mês)</span>
            </div>
            <div className="flex items-center gap-2">
              {bookingLimitOk ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {bookingsThisMonth} / {limits.maxBookingsPerMonth || '∞'}
              </span>
            </div>
          </div>
          {limits.maxBookingsPerMonth && (
            <Progress 
              value={getBookingProgress()} 
              className="h-2"
            />
          )}
        </div>

        {/* Limitações de Propriedades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="font-medium">Propriedades</span>
            </div>
            <div className="flex items-center gap-2">
              {propertyLimitOk ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {properties.length} / {limits.maxProperties || '∞'}
              </span>
            </div>
          </div>
          {limits.maxProperties && (
            <Progress 
              value={getPropertyProgress()} 
              className="h-2"
            />
          )}
        </div>

        {/* Recursos Disponíveis */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">RECURSOS DISPONÍVEIS</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {limits.hasWhatsAppIntegration ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              {limits.hasFinancialDashboard ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>Dashboard Financeiro</span>
            </div>
            <div className="flex items-center gap-2">
              {limits.hasReportsExport ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>Exportar Relatórios</span>
            </div>
            <div className="flex items-center gap-2">
              {limits.hasAirbnbSync ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>Sync Airbnb</span>
            </div>
            <div className="flex items-center gap-2">
              {limits.hasICalExport ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>iCal Export</span>
            </div>
            <div className="flex items-center gap-2">
              {limits.hasPrioritySupport ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span>Suporte Prioritário</span>
            </div>
          </div>
        </div>

        {/* Tipo de Sincronização Airbnb */}
        <div className="text-xs text-muted-foreground">
          <strong>Sync Airbnb:</strong> {
            limits.airbnbSyncType === 'none' ? 'Nenhum' :
            limits.airbnbSyncType === 'export-only' ? 'Apenas Exportação' :
            'Bidirecional'
          }
        </div>
      </CardContent>
    </Card>
  );
};