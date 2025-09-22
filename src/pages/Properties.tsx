
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import OptimizedPropertyCard from '@/components/properties/OptimizedPropertyCard';
import PropertyForm from '@/components/properties/PropertyForm';
import ICalSyncSettings from '@/components/properties/ICalSyncSettings';
import { PlanUpgradePrompt } from '@/components/PlanUpgradePrompt';
import { FeatureRestriction } from '@/components/FeatureRestriction';
import { Property } from '@/types/property';

const Properties = () => {
  const { properties, loading, addProperty, updateProperty, deleteProperty } = useOptimizedProperties();
  const { checkPropertyLimit, limits } = usePlanRestrictions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | undefined>();

  const canAddProperty = checkPropertyLimit(properties.length);

  const handleAddProperty = () => {
    if (!canAddProperty) {
      return; // Não abre o dialog se não pode adicionar
    }
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

  const handleDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    await deleteProperty(propertyToDelete.id);
    setDeleteDialogOpen(false);
    setPropertyToDelete(undefined);
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
    <div className="p-3 md:p-4 space-y-4 md:space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Home className="h-5 md:h-6 w-5 md:w-6 text-sage-600" />
          <h1 className="text-xl md:text-2xl font-bold text-sage-800">Meus Chalés</h1>
        </div>
        <Button 
          onClick={handleAddProperty} 
          disabled={!canAddProperty}
          className="bg-sage-600 hover:bg-sage-700 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canAddProperty ? `Limite de ${limits.maxProperties} propriedades atingido` : undefined}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Adicionar Chalé</span>
          <span className="sm:hidden">Novo Chalé</span>
        </Button>
      </div>

      {/* Prompt de upgrade se limite atingido */}
      {!canAddProperty && (
        <PlanUpgradePrompt 
          feature="mais propriedades"
          description={`Limite de ${limits.maxProperties} propriedades atingido`}
          compact
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Home className="h-3 md:h-4 w-3 md:w-4" />
            <span className="hidden sm:inline">Propriedades</span>
            <span className="sm:hidden">Chalés</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Calendar className="h-3 md:h-4 w-3 md:w-4" />
            <span className="hidden sm:inline">Sincronização</span>
            <span className="sm:hidden">Sync</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4 md:space-y-6">
          {/* Conteúdo das Propriedades */}
          {properties.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Home className="h-10 md:h-12 w-10 md:w-12 text-sage-300 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-sage-800 mb-2">
                Nenhum chalé cadastrado
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 max-w-md mx-auto px-4">
                Comece criando seu primeiro chalé para organizar suas reservas por propriedade.
              </p>
              <Button onClick={handleAddProperty} className="bg-sage-600 hover:bg-sage-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Chalé
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-2 gap-4 md:gap-6">
              {properties.map((property) => (
                <OptimizedPropertyCard
                  key={property.id}
                  property={property}
                  onEdit={handleEditProperty}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteProperty}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync">
          <FeatureRestriction
            feature="hasAirbnbSync"
            featureName="sincronização de calendários"
            description="Sincronize com Airbnb e outras plataformas automaticamente"
            showUpgradePrompt={true}
          >
            <ICalSyncSettings properties={properties} />
          </FeatureRestriction>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar/editar propriedade */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a propriedade "{propertyToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Properties;
