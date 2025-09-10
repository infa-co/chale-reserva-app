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

      {/* Main Content - Responsive Layout */}
      <div className="p-6">
        {/* Mobile/Tablet Layout */}
        <div className="xl:hidden">
          {/* Header with Icon and Basic Info */}
          <div className="flex items-start gap-4 mb-6 pr-20">
            <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-foreground leading-tight mb-2 truncate">
                {property.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg transition-colors">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Capacidade</p>
                <p className="text-sm font-semibold text-foreground">{property.capacity} hóspedes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg transition-colors">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Diária</p>
                <p className="text-sm font-semibold text-foreground">{formattedRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout (XL and above) */}
        <div className="hidden xl:block">
          <div className="flex items-start gap-8 mb-8 pr-24">
            {/* Icon Section */}
            <div className="flex-shrink-0 p-5 bg-primary/10 rounded-2xl">
              <Home className="h-10 w-10 text-primary" />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <h3 className="text-3xl font-bold text-foreground leading-tight mb-4">
                {property.name}
              </h3>
              <div className="flex items-center gap-3 text-lg text-muted-foreground mb-6">
                <MapPin className="h-6 w-6 flex-shrink-0" />
                <span>{property.location}</span>
              </div>
              
              {/* Property Details - Horizontal Layout for Desktop */}
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-5 p-6 bg-muted/30 rounded-xl transition-all hover:bg-muted/50">
                  <div className="p-3 bg-primary/15 rounded-xl">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Capacidade</p>
                    <p className="text-xl font-bold text-foreground">{property.capacity} hóspedes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 p-6 bg-muted/30 rounded-xl transition-all hover:bg-muted/50">
                  <div className="p-3 bg-primary/15 rounded-xl">
                    <DollarSign className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Diária</p>
                    <p className="text-xl font-bold text-foreground">{formattedRate}</p>
                  </div>
                </div>
              </div>
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