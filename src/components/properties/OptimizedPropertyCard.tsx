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
      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        {!property.is_active && (
          <Badge variant="destructive" className="text-xs font-medium px-2.5 py-1 shadow-sm">
            Inativo
          </Badge>
        )}
        
        {/* Sync Status Badge */}
        {propertySyncs.length > 0 && (
          <Badge 
            variant={activeSyncs.length > 0 ? "default" : "secondary"} 
            className="text-xs font-medium px-2.5 py-1 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="h-3 w-3" />
            {activeSyncs.length > 0 
              ? `${activeSyncs.length} ativa${activeSyncs.length > 1 ? 's' : ''}`
              : `${propertySyncs.length} inativa${propertySyncs.length > 1 ? 's' : ''}`
            }
          </Badge>
        )}
      </div>

      {/* Unified Responsive Layout */}
      <div className="p-4 md:p-6 xl:p-8">
        {/* Header with Icon and Basic Info */}
        <div className="flex items-start gap-3 md:gap-4 xl:gap-6 mb-4 md:mb-6 xl:mb-8 pr-16 md:pr-20 xl:pr-24">
          <div className="flex-shrink-0 p-2.5 md:p-3 xl:p-4 bg-primary/10 rounded-lg xl:rounded-xl">
            <Home className="h-5 w-5 md:h-6 md:w-6 xl:h-8 xl:w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl xl:text-2xl font-semibold xl:font-bold text-foreground leading-tight mb-1 md:mb-2 xl:mb-3 truncate">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 xl:gap-3 text-xs md:text-sm xl:text-base text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 xl:h-5 xl:w-5 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 xl:gap-6 mb-4 md:mb-6 xl:mb-8">
          <div className="flex items-center gap-2.5 md:gap-3 xl:gap-4 p-3 md:p-4 xl:p-5 bg-muted/50 rounded-lg xl:rounded-xl transition-colors">
            <div className="p-1.5 md:p-2 xl:p-2.5 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs xl:text-sm text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Capacidade</p>
              <p className="text-sm md:text-sm xl:text-lg font-semibold xl:font-bold text-foreground">{property.capacity} hóspedes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 md:gap-3 xl:gap-4 p-3 md:p-4 xl:p-5 bg-muted/50 rounded-lg xl:rounded-xl transition-colors">
            <div className="p-1.5 md:p-2 xl:p-2.5 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs xl:text-sm text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Diária</p>
              <p className="text-sm md:text-sm xl:text-lg font-semibold xl:font-bold text-foreground">{formattedRate}</p>
            </div>
          </div>
        </div>

        {/* Fixed Notes */}
        {property.fixed_notes && (
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg mb-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {property.fixed_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row xl:flex-row gap-3 xl:gap-4">
          <Link to={`/chale/${property.id}/dashboard`} className="flex-1">
            <Button 
              size="default" 
              className="w-full h-12 xl:h-14 font-medium transition-all duration-200 hover:scale-[1.02] text-base xl:text-lg xl:font-semibold"
            >
              <Eye className="h-5 w-5 xl:h-6 xl:w-6 mr-2 xl:mr-3" />
              Ver Dashboard
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default" 
                className="h-12 xl:h-14 px-6 xl:px-8 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 text-base xl:text-lg xl:font-semibold"
              >
                <MoreVertical className="h-5 w-5 xl:h-6 xl:w-6 mr-2 xl:mr-3" />
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 xl:w-56">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer xl:text-base xl:py-3">
                <Edit className="h-4 w-4 xl:h-5 xl:w-5 mr-2" />
                Editar Propriedade
              </DropdownMenuItem>
              {onManageSync && (
                <DropdownMenuItem onClick={handleManageSync} className="cursor-pointer xl:text-base xl:py-3">
                  <Calendar className="h-4 w-4 xl:h-5 xl:w-5 mr-2" />
                  Gerenciar Sincronização
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer xl:text-base xl:py-3">
                <Archive className="h-4 w-4 xl:h-5 xl:w-5 mr-2" />
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