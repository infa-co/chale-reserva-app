import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileText, FileSpreadsheet, File, Loader2, Home } from 'lucide-react';
import { useBookingExport } from '@/hooks/useBookingExport';
import { Booking } from '@/types/booking';
import { Property } from '@/types/property';

interface BookingExportDialogProps {
  activeBookings: Booking[];
  historicalBookings: Booking[];
  totalCount: number;
  properties?: Property[];
}

type ExportFormat = 'csv' | 'json' | 'pdf';

const BookingExportDialog = ({ activeBookings, historicalBookings, totalCount, properties = [] }: BookingExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const { exportBookings, isExporting } = useBookingExport();

  const filteredBookings = useMemo(() => {
    if (selectedPropertyId === 'all') {
      return { active: activeBookings, historical: historicalBookings };
    }
    
    const propertyId = selectedPropertyId === 'none' ? null : selectedPropertyId;
    
    return {
      active: activeBookings.filter(booking => booking.property_id === propertyId),
      historical: historicalBookings.filter(booking => booking.property_id === propertyId)
    };
  }, [activeBookings, historicalBookings, selectedPropertyId]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const propertyName = selectedPropertyId === 'all' ? null : 
                      selectedPropertyId === 'none' ? 'Sem Chalé' : 
                      selectedProperty?.name || 'Propriedade não encontrada';

  const handleExport = async (format: ExportFormat) => {
    await exportBookings(filteredBookings.active, filteredBookings.historical, format, propertyName);
    setOpen(false);
  };

  const exportOptions = [
    {
      format: 'pdf' as const,
      title: 'Relatório PDF',
      description: 'Relatório completo com estatísticas e tabelas formatadas',
      icon: FileText,
      recommended: true
    },
    {
      format: 'csv' as const,
      title: 'Planilha CSV',
      description: 'Dados tabulares para Excel, Google Sheets, etc.',
      icon: FileSpreadsheet,
      recommended: false
    },
    {
      format: 'json' as const,
      title: 'Arquivo JSON',
      description: 'Dados estruturados para análise técnica',
      icon: File,
      recommended: false
    }
  ];

  const activeCount = filteredBookings.active.length;
  const historicalCount = filteredBookings.historical.length;
  const filteredTotalCount = activeCount + historicalCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <FileDown size={16} />
          <span className="hidden sm:inline">Exportar Reservas</span>
          <span className="sm:hidden">Exportar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-auto sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileDown size={16} />
            Exportar Reservas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Property Filter */}
          {properties.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sage-800 text-sm flex items-center gap-2">
                <Home size={14} />
                Filtrar por Chalé
              </h4>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um chalé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Chalés</SelectItem>
                  <SelectItem value="none">Sem Chalé Definido</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Summary Card */}
          <div className="bg-sage-50 rounded-lg p-3 border border-sage-200">
            <h4 className="font-medium text-sage-800 mb-2 text-sm">
              Resumo dos Dados
              {propertyName && <span className="text-sage-600"> - {propertyName}</span>}
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-sage-600">Ativas</div>
                <div className="text-base font-bold text-sage-800">{activeCount}</div>
              </div>
              <div>
                <div className="text-xs text-sage-600">Históricas</div>
                <div className="text-base font-bold text-sage-800">{historicalCount}</div>
              </div>
              <div className="border-l border-sage-300 pl-2">
                <div className="text-xs text-sage-600">Total</div>
                <div className="text-lg font-bold text-sage-700">{filteredTotalCount}</div>
              </div>
            </div>
          </div>

          {isExporting ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-sage-600" />
                <p className="text-sm text-sage-800">Gerando exportação...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="font-medium text-sage-800 text-base">Escolha o formato:</h4>
              </div>
              
              <div className="space-y-2">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.format}
                      variant="outline"
                      className="w-full justify-start h-auto p-3 relative hover:bg-sage-50 border-sage-200"
                      onClick={() => handleExport(option.format)}
                    >
                      {option.recommended && (
                        <div className="absolute -top-1 -right-1 bg-sage-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                          ⭐
                        </div>
                      )}
                      <div className="flex items-center w-full">
                        <div className="flex-shrink-0 w-8 h-8 bg-sage-100 rounded-md flex items-center justify-center mr-3">
                          <Icon size={16} className="text-sage-600" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-sage-800 text-sm">{option.title}</div>
                          <div className="text-xs text-sage-600 leading-snug">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingExportDialog;