import React, { memo, useMemo } from 'react';
import { Home, MapPin, Users, DollarSign, MoreVertical, Eye, Edit, Archive, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useOptimizedICalSyncs } from '@/hooks/useOptimizedICalSyncs';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onToggleActive: (property: Property) => void;
  onManageSync?: (property: Property) => void;
}

const OptimizedPropertyCard = memo(({ property, onEdit, onToggleActive, onManageSync }: PropertyCardProps) => {
  const { getSyncsForProperty } = useOptimizedICalSyncs();
  
  const { propertySyncs, activeSyncs, formattedRate } = useMemo(() => {
    const propertySyncs = getSyncsForProperty(property.id);
    const activeSyncs = propertySyncs.filter(sync => sync.is_active);
    const formattedRate = property.default_daily_rate 
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(property.default_daily_rate)
      : 'Não definido';
    
    return { propertySyncs, activeSyncs, formattedRate };
  }, [property.id, property.default_daily_rate, getSyncsForProperty]);

  const handleEdit = () => onEdit(property);
  const handleToggleActive = () => onToggleActive(property);
  const handleManageSync = () => onManageSync?.(property);

  return (
    <Card className={`group relative transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-0 shadow-sm bg-background/50 backdrop-blur ${!property.is_active ? 'opacity-60 grayscale-[50%]' : ''}`}>
      {/* Status Badges - Top Right */}
      <div className="absolute top-3 md:top-4 xl:top-5 right-3 md:right-4 xl:right-5 z-10 flex flex-col items-end gap-1.5 md:gap-2">
        {!property.is_active && (
          <Badge variant="destructive" className="text-xs md:text-sm font-medium px-2 md:px-2.5 xl:px-3 py-1 md:py-1.5 shadow-sm">
            Inativo
          </Badge>
        )}
        
        {/* Sync Status Badge */}
        {propertySyncs.length > 0 && (
          <Badge 
            variant={activeSyncs.length > 0 ? "default" : "secondary"} 
            className="text-xs md:text-sm font-medium px-2 md:px-2.5 xl:px-3 py-1 md:py-1.5 flex items-center gap-1 md:gap-1.5 shadow-sm"
          >
            <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {activeSyncs.length > 0 
              ? `${activeSyncs.length} ativa${activeSyncs.length > 1 ? 's' : ''}`
              : `${propertySyncs.length} inativa${propertySyncs.length > 1 ? 's' : ''}`
            }
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-5 xl:p-6">
        {/* Header with Icon and Basic Info */}
        <div className="flex items-start gap-3 md:gap-4 xl:gap-5 mb-5 md:mb-6 xl:mb-7 pr-14 md:pr-16 xl:pr-20">
          <div className="flex-shrink-0 p-2.5 md:p-3 xl:p-3.5 bg-primary/10 rounded-lg xl:rounded-xl">
            <Home className="h-5 w-5 md:h-6 md:w-6 xl:h-7 xl:w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl xl:text-2xl font-semibold xl:font-bold text-foreground leading-tight mb-1 md:mb-1.5 xl:mb-2 truncate">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 xl:gap-2.5 text-sm md:text-base xl:text-lg text-muted-foreground">
              <MapPin className="h-4 w-4 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
        </div>

        {/* Property Details - Perfect Mobile Layout */}
        <div className="space-y-4 md:space-y-5 xl:space-y-6 mb-5 md:mb-6 xl:mb-7">
          {/* Capacidade */}
          <div className="flex items-center gap-3 md:gap-4 xl:gap-5">
            <div className="p-2 md:p-2.5 xl:p-3 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs md:text-sm xl:text-base text-muted-foreground uppercase tracking-wider font-medium mb-1 md:mb-1.5">
                CAPACIDADE
              </p>
              <p className="text-sm md:text-base xl:text-lg font-semibold text-foreground">
                {property.capacity} hóspedes
              </p>
            </div>
          </div>
          
          {/* Diária */}
          <div className="flex items-center gap-3 md:gap-4 xl:gap-5">
            <div className="p-2 md:p-2.5 xl:p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs md:text-sm xl:text-base text-muted-foreground uppercase tracking-wider font-medium mb-1 md:mb-1.5">
                DIÁRIA
              </p>
              <p className="text-sm md:text-base xl:text-lg font-semibold text-foreground">
                {formattedRate}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Notes */}
        {property.fixed_notes && (
          <div className="p-3 md:p-4 xl:p-5 bg-primary/5 border border-primary/10 rounded-lg mb-5 md:mb-6 xl:mb-7">
            <p className="text-sm md:text-base xl:text-lg text-foreground/80 leading-relaxed">
              {property.fixed_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 xl:gap-4">
          <Link to={`/chale/${property.id}/dashboard`} className="flex-1">
            <Button 
              size="default" 
              className="w-full h-11 md:h-12 xl:h-14 font-medium transition-all duration-200 hover:scale-[1.02] text-sm md:text-base xl:text-lg"
            >
              <Eye className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 mr-2 md:mr-2.5 xl:mr-3" />
              Ver Dashboard
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default" 
                className="h-11 md:h-12 xl:h-14 px-4 md:px-6 xl:px-8 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 text-sm md:text-base xl:text-lg"
              >
                <MoreVertical className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 mr-2 md:mr-2.5 xl:mr-3" />
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-52 xl:w-56">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer md:text-base xl:py-3">
                <Edit className="h-4 w-4 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5 mr-2" />
                Editar Propriedade
              </DropdownMenuItem>
              {onManageSync && (
                <DropdownMenuItem onClick={handleManageSync} className="cursor-pointer md:text-base xl:py-3">
                  <Calendar className="h-4 w-4 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5 mr-2" />
                  Gerenciar Sincronização
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer md:text-base xl:py-3">
                <Archive className="h-4 w-4 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5 mr-2" />
                {property.is_active ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';

export default OptimizedPropertyCard;