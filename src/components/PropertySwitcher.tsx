import { memo } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useProperty } from '@/contexts/PropertyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const PropertySwitcher = memo(() => {
  const { properties, activeProperty, setActivePropertyId, loading, hasMultipleProperties } = useProperty();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Link to="/meus-chales">
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span>Adicionar Chalé</span>
        </Button>
      </Link>
    );
  }

  // Se só tem uma propriedade, mostra de forma simplificada
  if (!hasMultipleProperties && activeProperty) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
          {activeProperty.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">
            {activeProperty?.name || 'Selecionar Chalé'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {properties.map((property) => (
          <DropdownMenuItem
            key={property.id}
            onClick={() => setActivePropertyId(property.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{property.name}</p>
                <p className="text-xs text-muted-foreground truncate">{property.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!property.is_active && (
                <Badge variant="secondary" className="text-xs">Inativo</Badge>
              )}
              {property.id === activeProperty?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/meus-chales" className="flex items-center gap-2 cursor-pointer">
            <Building2 className="h-4 w-4" />
            <span>Gerenciar Chalés</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

PropertySwitcher.displayName = 'PropertySwitcher';

export default PropertySwitcher;
