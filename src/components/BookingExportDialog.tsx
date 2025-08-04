import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { useBookingExport } from '@/hooks/useBookingExport';
import { Booking } from '@/types/booking';

interface BookingExportDialogProps {
  activeBookings: Booking[];
  historicalBookings: Booking[];
  totalCount: number;
}

type ExportFormat = 'csv' | 'json' | 'pdf';

const BookingExportDialog = ({ activeBookings, historicalBookings, totalCount }: BookingExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const { exportBookings, isExporting } = useBookingExport();

  const handleExport = async (format: ExportFormat) => {
    await exportBookings(activeBookings, historicalBookings, format);
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

  const activeCount = activeBookings.length;
  const historicalCount = historicalBookings.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <FileDown size={16} />
          <span className="hidden sm:inline">Exportar Reservas</span>
          <span className="sm:hidden">Exportar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-auto sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileDown size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Exportar Dados de Reservas</span>
            <span className="sm:hidden">Exportar Reservas</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Data Summary Card */}
          <div className="bg-gradient-to-r from-sage-50 to-sage-100 rounded-xl p-4 border border-sage-200">
            <h4 className="font-semibold text-sage-800 mb-3 text-base flex items-center gap-2">
              <FileDown size={16} />
              Resumo dos Dados
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-xs text-sage-600 font-medium">Ativas</div>
                <div className="text-lg font-bold text-sage-800">{activeCount}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-sage-600 font-medium">Históricas</div>
                <div className="text-lg font-bold text-sage-800">{historicalCount}</div>
              </div>
              <div className="space-y-1 border-l border-sage-300 pl-2">
                <div className="text-xs text-sage-600 font-medium">Total</div>
                <div className="text-xl font-bold text-sage-700">{totalCount}</div>
              </div>
            </div>
          </div>

          {isExporting ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-sage-600" />
                <div className="space-y-1">
                  <p className="font-medium text-sage-800">Gerando exportação...</p>
                  <p className="text-sm text-sage-600">Isso pode levar alguns segundos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-sage-800 text-lg">Escolha o formato</h4>
                <p className="text-sm text-sage-600 mt-1">Selecione como deseja exportar seus dados</p>
              </div>
              
              <div className="space-y-3">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.format}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 relative hover:bg-sage-50 transition-colors group border-sage-200"
                      onClick={() => handleExport(option.format)}
                    >
                      {option.recommended && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-sage-600 to-sage-700 text-white text-xs px-2 py-1 rounded-full shadow-md">
                          ⭐ Recomendado
                        </div>
                      )}
                      <div className="flex items-center w-full">
                        <div className="flex-shrink-0 w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-sage-200 transition-colors">
                          <Icon size={20} className="text-sage-600" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold text-sage-800 text-base mb-1">{option.title}</div>
                          <div className="text-sm text-sage-600 leading-relaxed">
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