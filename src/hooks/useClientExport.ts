
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export type ExportFormat = 'csv' | 'json' | 'pdf';

export const useClientExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getClientExportData = (client: ProcessedClient) => {
    const firstBooking = client.bookings.length > 0 
      ? new Date(Math.min(...client.bookings.map(b => new Date(b.check_in).getTime())))
      : null;
    
    const lastBooking = client.bookings.length > 0 
      ? new Date(Math.max(...client.bookings.map(b => new Date(b.check_in).getTime())))
      : null;

    return {
      nome: client.name,
      telefone: client.phone,
      email: client.email || '',
      cidade: client.city || '',
      estado: client.state || '',
      total_reservas: client.total_bookings,
      receita_total: client.total_revenue,
      ticket_medio: Math.round(client.total_revenue / client.total_bookings) || 0,
      tags: client.tags.join(', '),
      primeira_reserva: firstBooking ? firstBooking.toLocaleDateString('pt-BR') : '',
      ultima_reserva: lastBooking ? lastBooking.toLocaleDateString('pt-BR') : ''
    };
  };

  const exportToCSV = (clients: ProcessedClient[]) => {
    const headers = [
      'Nome',
      'Telefone',
      'Email', 
      'Cidade',
      'Estado',
      'Total de Reservas',
      'Receita Total',
      'Ticket Médio',
      'Tags',
      'Primeira Reserva',
      'Última Reserva'
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client => {
        const data = getClientExportData(client);
        return [
          `"${data.nome}"`,
          `"${data.telefone}"`,
          `"${data.email}"`,
          `"${data.cidade}"`,
          `"${data.estado}"`,
          data.total_reservas,
          `"${formatCurrency(data.receita_total)}"`,
          `"${formatCurrency(data.ticket_medio)}"`,
          `"${data.tags}"`,
          `"${data.primeira_reserva}"`,
          `"${data.ultima_reserva}"`
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const exportToJSON = (clients: ProcessedClient[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalClients: clients.length,
      clients: clients.map(client => getClientExportData(client))
    };

    return JSON.stringify(exportData, null, 2);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportClients = async (clients: ProcessedClient[], format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      let content: string;
      let filename: string;
      let contentType: string;

      switch (format) {
        case 'csv':
          content = exportToCSV(clients);
          filename = `clientes_${timestamp}.csv`;
          contentType = 'text/csv;charset=utf-8;';
          break;
        
        case 'json':
          content = exportToJSON(clients);
          filename = `clientes_${timestamp}.json`;
          contentType = 'application/json;charset=utf-8;';
          break;
        
        default:
          throw new Error('Formato não suportado');
      }

      // Add BOM for CSV to ensure proper encoding in Excel
      if (format === 'csv') {
        content = '\uFEFF' + content;
      }

      downloadFile(content, filename, contentType);

      toast({
        title: "Exportação concluída!",
        description: `${clients.length} cliente${clients.length !== 1 ? 's' : ''} exportado${clients.length !== 1 ? 's' : ''} em formato ${format.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportClients,
    isExporting
  };
};
