
import { useState } from 'react';
import { Plus, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import OptimizedPropertyCard from '@/components/properties/OptimizedPropertyCard';
import PropertyForm from '@/components/properties/PropertyForm';
import OptimizedSyncManager from '@/components/properties/OptimizedSyncManager';
import { Property } from '@/types/property';

const Properties = () => {
  const { properties, loading, addProperty, updateProperty } = useOptimizedProperties();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProperty = () => {
    setEditingProperty(undefined);
    setIsDialogOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (property: Property) => {
    await updateProperty(property.id, { is_active: !property.is_active });
  };

  const handleSubmit = async (data: Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    
    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, data);
      } else {
        await addProperty(data);
      }
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingProperty(undefined);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">Carregando propriedades...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-6 w-6 text-sage-600" />
          <h1 className="text-2xl font-bold text-sage-800">Meus Chalés</h1>
        </div>
        <Button onClick={handleAddProperty} className="bg-sage-600 hover:bg-sage-700">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Chalé
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Propriedades
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sincronização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-6">
          {/* Conteúdo das Propriedades */}
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-sage-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sage-800 mb-2">
                Nenhum chalé cadastrado
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Comece criando seu primeiro chalé para organizar suas reservas por propriedade.
              </p>
              <Button onClick={handleAddProperty} className="bg-sage-600 hover:bg-sage-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Chalé
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <OptimizedPropertyCard
                  key={property.id}
                  property={property}
                  onEdit={handleEditProperty}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync">
          <OptimizedSyncManager properties={properties} />
        </TabsContent>
      </Tabs>

      {/* Dialog para criar/editar propriedade */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? 'Editar' : 'Adicionar'} Chalé
            </DialogTitle>
          </DialogHeader>
          <PropertyForm
            property={editingProperty}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;
