
import { Home, MapPin, Users, DollarSign, MoreVertical, Eye, Edit, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Property } from '@/types/property';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onToggleActive: (property: Property) => void;
}

const PropertyCard = ({ property, onEdit, onToggleActive }: PropertyCardProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${!property.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sage-100 rounded-lg">
              <Home className="h-5 w-5 text-sage-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sage-800">{property.name}</h3>
              {!property.is_active && (
                <span className="text-xs text-red-500 font-medium">Inativo</span>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/chale/${property.id}/dashboard`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(property)}>
                <Archive className="h-4 w-4 mr-2" />
                {property.is_active ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Até {property.capacity} hóspedes</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(property.default_daily_rate)} por diária</span>
          </div>
        </div>

        {property.fixed_notes && (
          <div className="mt-4 p-3 bg-sage-50 rounded-lg">
            <p className="text-sm text-sage-700">{property.fixed_notes}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link to={`/chale/${property.id}/dashboard`}>
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
