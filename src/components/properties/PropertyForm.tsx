
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Property } from '@/types/property';

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PropertyForm = ({ property, onSubmit, onCancel, loading }: PropertyFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 1,
    default_daily_rate: '',
    fixed_notes: '',
    is_active: true
  });

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        location: property.location,
        capacity: property.capacity,
        default_daily_rate: property.default_daily_rate?.toString() || '',
        fixed_notes: property.fixed_notes || '',
        is_active: property.is_active
      });
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name,
      location: formData.location,
      capacity: formData.capacity,
      default_daily_rate: formData.default_daily_rate ? parseFloat(formData.default_daily_rate) : undefined,
      fixed_notes: formData.fixed_notes || undefined,
      is_active: formData.is_active
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Imóvel *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Chalé da Montanha"
            required
          />
        </div>

        <div>
          <Label htmlFor="location">Localização *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Ex: Campos do Jordão, SP"
            required
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacidade de Hóspedes *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="default_daily_rate">Valor Padrão por Diária (opcional)</Label>
          <Input
            id="default_daily_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.default_daily_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, default_daily_rate: e.target.value }))}
            placeholder="Ex: 250.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Este valor será sugerido automaticamente ao criar novas reservas
          </p>
        </div>

        <div>
          <Label htmlFor="fixed_notes">Observações Fixas (opcional)</Label>
          <Textarea
            id="fixed_notes"
            value={formData.fixed_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, fixed_notes: e.target.value }))}
            placeholder="Ex: Tem lareira, Aceita pets, Sem Wi-Fi..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Estas observações aparecerão automaticamente em todas as reservas deste imóvel
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : property ? 'Atualizar' : 'Criar'} Propriedade
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
