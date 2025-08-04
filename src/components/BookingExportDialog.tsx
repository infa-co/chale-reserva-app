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
        <Button variant="outline" className="gap-2">
          <FileDown size={16} />
          Exportar Reservas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown size={20} />
            Exportar Dados de Reservas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-sage-50 rounded-lg p-4">
            <h4 className="font-medium text-sage-800 mb-2">Resumo dos Dados</h4>
            <div className="space-y-1 text-sm text-sage-600">
              <div className="flex justify-between">
                <span>Reservas Ativas:</span>
                <span className="font-medium">{activeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Reservas Históricas:</span>
                <span className="font-medium">{historicalCount}</span>
              </div>
              <div className="flex justify-between border-t border-sage-200 pt-1 mt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{totalCount}</span>
              </div>
            </div>
          </div>

          {isExporting ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-sage-600" />
                <p className="text-sm text-sage-600">Gerando exportação...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium text-sage-800 mb-3">Escolha o formato de exportação:</h4>
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.format}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 relative"
                    onClick={() => handleExport(option.format)}
                  >
                    {option.recommended && (
                      <div className="absolute -top-1 -right-1 bg-sage-600 text-white text-xs px-2 py-1 rounded-full">
                        Recomendado
                      </div>
                    )}
                    <Icon size={20} className="mr-3 text-sage-600" />
                    <div className="text-left">
                      <div className="font-medium text-sage-800">{option.title}</div>
                      <div className="text-sm text-sage-600 mt-1">{option.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingExportDialog;