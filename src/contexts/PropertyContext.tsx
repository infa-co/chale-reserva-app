import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { Property } from '@/types/property';

const ACTIVE_PROPERTY_KEY = 'ordomo-active-property-id';

interface PropertyContextType {
  properties: Property[];
  activeProperty: Property | null;
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  loading: boolean;
  hasMultipleProperties: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider = ({ children }: { children: ReactNode }) => {
  const { properties, loading } = useOptimizedProperties();
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(() => {
    // Inicializa do localStorage
    return localStorage.getItem(ACTIVE_PROPERTY_KEY);
  });

  // Encontra a propriedade ativa
  const activeProperty = useMemo(() => {
    if (!activePropertyId) return null;
    return properties.find(p => p.id === activePropertyId) || null;
  }, [activePropertyId, properties]);

  // Verifica se tem múltiplas propriedades
  const hasMultipleProperties = properties.length > 1;

  // Lógica de auto-seleção quando as propriedades carregam
  useEffect(() => {
    if (loading || properties.length === 0) return;

    // Se não tem propriedade ativa ou a ativa não existe mais
    if (!activePropertyId || !properties.find(p => p.id === activePropertyId)) {
      // Tenta usar a salva no localStorage
      const savedId = localStorage.getItem(ACTIVE_PROPERTY_KEY);
      const savedPropertyExists = savedId && properties.find(p => p.id === savedId);
      
      if (savedPropertyExists) {
        setActivePropertyIdState(savedId);
      } else {
        // Seleciona a primeira propriedade ativa como padrão
        const firstActive = properties.find(p => p.is_active) || properties[0];
        if (firstActive) {
          setActivePropertyIdState(firstActive.id);
          localStorage.setItem(ACTIVE_PROPERTY_KEY, firstActive.id);
        }
      }
    }
  }, [loading, properties, activePropertyId]);

  // Função para mudar a propriedade ativa
  const setActivePropertyId = useCallback((id: string | null) => {
    setActivePropertyIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_PROPERTY_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROPERTY_KEY);
    }
  }, []);

  const value = useMemo(() => ({
    properties,
    activeProperty,
    activePropertyId,
    setActivePropertyId,
    loading,
    hasMultipleProperties,
  }), [properties, activeProperty, activePropertyId, setActivePropertyId, loading, hasMultipleProperties]);

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};
