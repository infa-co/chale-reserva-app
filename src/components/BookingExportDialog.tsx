import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileText, FileSpreadsheet, File, Loader2, Home, Calendar } from 'lucide-react';
import { useBookingExport } from '@/hooks/useBookingExport';
import { Booking } from '@/types/booking';
import { Property } from '@/types/property';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { exportBookings, isExporting } = useBookingExport();

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    [...activeBookings, ...historicalBookings].forEach(booking => {
      if (booking.check_in) {
        try {
          const date = parseISO(booking.check_in);
          months.add(format(date, 'yyyy-MM'));
        } catch (error) {
          // Ignorar datas inválidas
        }
      }
    });
    
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a)) // Mais recente primeiro
      .map(monthKey => ({
        value: monthKey,
        label: format(parseISO(`${monthKey}-01`), 'MMMM yyyy', { locale: ptBR }),
        count: [...activeBookings, ...historicalBookings].filter(booking => {
          if (!booking.check_in) return false;
          try {
            return format(parseISO(booking.check_in), 'yyyy-MM') === monthKey;
          } catch (error) {
            return false;
          }
        }).length
      }));
  }, [activeBookings, historicalBookings]);

  const filteredBookings = useMemo(() => {
    let filtered = { active: activeBookings, historical: historicalBookings };
    
    // Filtro por propriedade
    if (selectedPropertyId !== 'all') {
      const propertyId = selectedPropertyId === 'none' ? null : selectedPropertyId;
      filtered = {
        active: filtered.active.filter(booking => booking.property_id === propertyId),
        historical: filtered.historical.filter(booking => booking.property_id === propertyId)
      };
    }
    
    // Filtro por mês
    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      
      filtered = {
        active: filtered.active.filter(booking => {
          if (!booking.check_in) return false;
          try {
            return isWithinInterval(parseISO(booking.check_in), { start: monthStart, end: monthEnd });
          } catch (error) {
            return false;
          }
        }),
        historical: filtered.historical.filter(booking => {
          if (!booking.check_in) return false;
          try {
            return isWithinInterval(parseISO(booking.check_in), { start: monthStart, end: monthEnd });
          } catch (error) {
            return false;
          }
        })
      };
    }
    
    return filtered;
  }, [activeBookings, historicalBookings, selectedPropertyId, selectedMonth]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const propertyName = selectedPropertyId === 'all' ? null : 
                      selectedPropertyId === 'none' ? 'Sem Chalé' : 
                      selectedProperty?.name || 'Propriedade não encontrada';

  const selectedMonthData = availableMonths.find(m => m.value === selectedMonth);
  const monthName = selectedMonth === 'all' ? null : selectedMonthData?.label;

  const handleExport = async (format: ExportFormat) => {
    await exportBookings(filteredBookings.active, filteredBookings.historical, format, propertyName, monthName);
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
        
        <div className="space-y-4">
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

          {/* Month Filter */}
          {availableMonths.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sage-800 text-sm flex items-center gap-2">
                <Calendar size={14} />
                Filtrar por Mês
              </h4>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label} ({month.count} reservas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear Filters Button */}
          {(selectedPropertyId !== 'all' || selectedMonth !== 'all') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedPropertyId('all');
                setSelectedMonth('all');
              }}
              className="w-full text-sage-600 border-sage-300 hover:bg-sage-50"
            >
              Limpar Filtros
            </Button>
          )}

          {/* Data Summary Card */}
          <div className="bg-sage-50 rounded-lg p-3 border border-sage-200">
            <h4 className="font-medium text-sage-800 mb-2 text-sm">
              Resumo dos Dados
              {propertyName && <span className="text-sage-600"> - {propertyName}</span>}
              {monthName && <span className="text-sage-600"> - {monthName}</span>}
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