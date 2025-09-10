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
    <Card className={`group relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 shadow-sm bg-background/50 backdrop-blur ${!property.is_active ? 'opacity-60 grayscale-[50%]' : ''}`}>
      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
        {!property.is_active && (
          <Badge variant="destructive" className="text-xs font-medium px-2 py-1">
            Inativo
          </Badge>
        )}
        
        {/* Sync Status Badge */}
        {propertySyncs.length > 0 && (
          <Badge 
            variant={activeSyncs.length > 0 ? "default" : "secondary"} 
            className="text-xs font-medium px-2 py-1 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {activeSyncs.length > 0 
              ? `${activeSyncs.length} ativa${activeSyncs.length > 1 ? 's' : ''}`
              : `${propertySyncs.length} inativa${propertySyncs.length > 1 ? 's' : ''}`
            }
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 pr-24">
          <div className="flex-shrink-0 p-2.5 bg-primary/10 rounded-xl">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground leading-tight mb-1 truncate">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Property Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Capacidade</p>
              <p className="text-sm font-medium truncate">{property.capacity} hóspedes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Diária</p>
              <p className="text-sm font-medium truncate">{formattedRate}</p>
            </div>
          </div>
        </div>

        {/* Fixed Notes */}
        {property.fixed_notes && (
          <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {property.fixed_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to={`/chale/${property.id}/dashboard`} className="flex-1">
            <Button 
              size="sm" 
              className="w-full h-9 font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 w-9 p-0 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Editar Propriedade
              </DropdownMenuItem>
              {onManageSync && (
                <DropdownMenuItem onClick={handleManageSync} className="cursor-pointer">
                  <Calendar className="h-4 w-4 mr-2" />
                  Gerenciar Sincronização
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer">
                <Archive className="h-4 w-4 mr-2" />
                {property.is_active ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';

export default OptimizedPropertyCard;