import React from 'react';
import { Building2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';

interface PropertySelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoSelectIfOne?: boolean;
}

export const PropertySelector = ({ value, onChange, required = false, autoSelectIfOne = false }: PropertySelectorProps) => {
  const { properties, loading } = useOptimizedProperties();

  // Auto-select if only one property exists
  React.useEffect(() => {
    if (autoSelectIfOne && properties.length === 1 && !value) {
      onChange(properties[0].id);
    }
  }, [properties, value, onChange, autoSelectIfOne]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
        <h3 className="font-semibold text-sage-800 flex items-center gap-2">
          <Building2 size={18} />
          Propriedade
        </h3>
        <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <h3 className="font-semibold text-sage-800 flex items-center gap-2">
        <Building2 size={18} />
        Propriedade {required && <span className="text-red-500">*</span>}
      </h3>
      
      <div>
        <Label htmlFor="property">Selecione a propriedade</Label>
        <Select value={value} onValueChange={onChange} required={required}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Escolha uma propriedade" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name} - {property.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {properties.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Nenhuma propriedade encontrada. Crie uma propriedade primeiro.
          </p>
        )}
      </div>
    </div>
  );
};