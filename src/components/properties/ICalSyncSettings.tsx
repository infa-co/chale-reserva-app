import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOptimizedICalSyncs } from '@/hooks/useOptimizedICalSyncs';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { Property } from '@/types/property';
import OptimizedSyncManager from './OptimizedSyncManager';
import { AirbnbConnection } from './AirbnbConnection';
import { PlanUpgradePrompt } from '@/components/PlanUpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';

interface ICalSyncSettingsProps {
  properties: Property[];
}

const ICalSyncSettings = ({ properties }: ICalSyncSettingsProps) => {
  const { loading } = useOptimizedICalSyncs();
  const { checkFeatureAccess } = usePlanRestrictions();
  const isMobile = useIsMobile();
  const [othersOpen, setOthersOpen] = useState(false);
  const canImport = checkFeatureAccess('hasAirbnbSync');
  const canExport = checkFeatureAccess('hasICalExport');
  const activeProperties = properties.filter((p) => p.is_active);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!canImport && !canExport) {
    return (
      <PlanUpgradePrompt
        feature="sincronização com o Airbnb"
        description="Sincronize seus chalés com o Airbnb e evite reservas duplicadas"
      />
    );
  }

  return (
    <div className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}>
      <Card>
        <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
          <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Airbnb</CardTitle>
          <CardDescription>
            Conecte cada chalé uma vez. As reservas do Airbnb entram no Ordomo a cada hora, e as do Ordomo ficam bloqueadas no Airbnb.
          </CardDescription>
        </CardHeader>
        <CardContent className={`space-y-3 ${isMobile ? 'px-4 pb-4' : ''}`}>
          {activeProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre um chalé na aba Propriedades para conectar ao Airbnb.</p>
          ) : (
            activeProperties.map((property) => <AirbnbConnection key={property.id} property={property} />)
          )}
        </CardContent>
      </Card>

      {canImport && (
        <Collapsible open={othersOpen} onOpenChange={setOthersOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <button className="w-full text-left">
                <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'px-4 py-3' : 'py-4'}`}>
                  <div>
                    <CardTitle className="text-sm">Outras plataformas e conexões avançadas</CardTitle>
                    <CardDescription className="text-xs">Booking.com, Vrbo e a lista de todas as conexões</CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${othersOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <OptimizedSyncManager properties={properties} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

export default ICalSyncSettings;
