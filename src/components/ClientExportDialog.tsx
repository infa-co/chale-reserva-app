import { useState } from 'react';
import { Download, FileText, Database, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useClientExport, ExportFormat } from '@/hooks/useClientExport';

interface ProcessedClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  bookings: any[];
  total_bookings: number;
  total_revenue: number;
}

interface ClientExportDialogProps {
  clients: ProcessedClient[];
  filteredCount: number;
}

const ClientExportDialog = ({ clients, filteredCount }: ClientExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const { exportClients, isExporting } = useClientExport();

  const handleExport = async (format: ExportFormat) => {
    await exportClients(clients, format);
    setOpen(false);
  };

  const exportOptions = [
    {
      format: 'csv' as ExportFormat,
      title: 'Planilha CSV',
      description: 'Para Excel, Google Sheets',
      icon: FileText,
    },
    {
      format: 'json' as ExportFormat,
      title: 'Arquivo JSON',
      description: 'Para backup ou uso técnico',
      icon: Database,
    },
    {
      format: 'pdf' as ExportFormat,
      title: 'Relatório PDF',
      description: 'Documento formatado para impressão',
      icon: File,
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={16} />
          Exportar Lista
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Lista de Clientes</DialogTitle>
          <DialogDescription>
            Selecione o formato para exportar {filteredCount} cliente{filteredCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {exportOptions.map(({ format, title, description, icon: Icon }) => (
            <Button
              key={format}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleExport(format)}
              disabled={isExporting}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-sage-600" />
                <div className="text-left">
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        {isExporting && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              Gerando arquivo... Por favor, aguarde.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientExportDialog;
