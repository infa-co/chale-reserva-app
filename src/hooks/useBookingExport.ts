import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProcessedBooking extends Omit<Booking, 'total_value'> {
  total_value: number;
  formatted_check_in: string;
  formatted_check_out: string;
  formatted_total_value: string;
  type: 'active' | 'historical';
}

type ExportFormat = 'csv' | 'json' | 'pdf';

export const useBookingExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBookingExportData = (booking: ProcessedBooking) => {
    return {
      nome: booking.guest_name,
      telefone: booking.phone,
      email: booking.email || '',
      cidade: booking.city || '',
      estado: booking.state || '',
      checkin: booking.formatted_check_in,
      checkout: booking.formatted_check_out,
      noites: booking.nights,
      valor: booking.formatted_total_value,
      status: booking.status,
      tipo: booking.type === 'historical' ? 'Histórica' : 'Ativa',
      observacoes: booking.notes || '',
      pagamento: booking.payment_method
    };
  };

  const processBookings = (activeBookings: Booking[], historicalBookings: Booking[]): ProcessedBooking[] => {
    const processedActive = activeBookings.map(booking => ({
      ...booking,
      total_value: Number(booking.total_value),
      formatted_check_in: format(parseISO(booking.check_in), 'dd/MM/yyyy', { locale: ptBR }),
      formatted_check_out: format(parseISO(booking.check_out), 'dd/MM/yyyy', { locale: ptBR }),
      formatted_total_value: formatCurrency(Number(booking.total_value)),
      type: 'active' as const
    }));

    const processedHistorical = historicalBookings.map(booking => ({
      ...booking,
      total_value: Number(booking.total_value),
      formatted_check_in: format(parseISO(booking.check_in), 'dd/MM/yyyy', { locale: ptBR }),
      formatted_check_out: format(parseISO(booking.check_out), 'dd/MM/yyyy', { locale: ptBR }),
      formatted_total_value: formatCurrency(Number(booking.total_value)),
      type: 'historical' as const
    }));

    return [...processedActive, ...processedHistorical];
  };

  const exportToCSV = (bookings: ProcessedBooking[]): string => {
    const headers = [
      'Nome', 'Telefone', 'Email', 'Cidade', 'Estado', 'Check-in', 'Check-out', 
      'Noites', 'Valor', 'Status', 'Tipo', 'Observações', 'Forma de Pagamento'
    ];
    
    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => {
        const data = getBookingExportData(booking);
        return [
          data.nome,
          data.telefone,
          data.email,
          data.cidade,
          data.estado,
          data.checkin,
          data.checkout,
          data.noites,
          data.valor,
          data.status,
          data.tipo,
          data.observacoes,
          data.pagamento
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const exportToJSON = (bookings: ProcessedBooking[]): string => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_bookings: bookings.length,
      active_bookings: bookings.filter(b => b.type === 'active').length,
      historical_bookings: bookings.filter(b => b.type === 'historical').length,
      total_revenue: bookings.reduce((sum, booking) => sum + booking.total_value, 0),
      bookings: bookings.map(getBookingExportData)
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportToPDF = (bookings: ProcessedBooking[]): jsPDF => {
    const doc = new jsPDF();
    
    // Calculate statistics
    const activeBookings = bookings.filter(b => b.type === 'active');
    const historicalBookings = bookings.filter(b => b.type === 'historical');
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_value, 0);
    const totalNights = bookings.reduce((sum, booking) => sum + booking.nights, 0);
    const averageTicket = bookings.length > 0 ? totalRevenue / bookings.length : 0;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OR DOMO - Relatório de Reservas', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
    
    // Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 20, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryY = 55;
    doc.text(`Total de Reservas: ${bookings.length}`, 20, summaryY);
    doc.text(`Reservas Ativas: ${activeBookings.length}`, 20, summaryY + 8);
    doc.text(`Reservas Históricas: ${historicalBookings.length}`, 20, summaryY + 16);
    doc.text(`Receita Total: ${formatCurrency(totalRevenue)}`, 20, summaryY + 24);
    doc.text(`Total de Noites: ${totalNights}`, 20, summaryY + 32);
    doc.text(`Ticket Médio: ${formatCurrency(averageTicket)}`, 20, summaryY + 40);

    let currentY = summaryY + 55;

    // Active Bookings Section
    if (activeBookings.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reservas Ativas', 20, currentY);
      currentY += 10;

      const activeTableData = activeBookings.map(booking => [
        booking.guest_name,
        booking.phone,
        booking.formatted_check_in,
        booking.formatted_check_out,
        booking.nights.toString(),
        booking.formatted_total_value,
        booking.status
      ]);

      autoTable(doc, {
        head: [['Nome', 'Telefone', 'Check-in', 'Check-out', 'Noites', 'Valor', 'Status']],
        body: activeTableData,
        startY: currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [76, 175, 80] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Historical Bookings Section
    if (historicalBookings.length > 0) {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reservas Históricas', 20, currentY);
      currentY += 10;

      const historicalTableData = historicalBookings.map(booking => [
        booking.guest_name,
        booking.phone,
        booking.formatted_check_in,
        booking.formatted_check_out,
        booking.nights.toString(),
        booking.formatted_total_value,
        booking.historical_registration_date ? 
          format(parseISO(booking.historical_registration_date), 'dd/MM/yyyy', { locale: ptBR }) : ''
      ]);

      autoTable(doc, {
        head: [['Nome', 'Telefone', 'Check-in', 'Check-out', 'Noites', 'Valor', 'Reg. em']],
        body: historicalTableData,
        startY: currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [156, 39, 176] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 }
        }
      });
    }

    return doc;
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportBookings = async (
    activeBookings: Booking[], 
    historicalBookings: Booking[], 
    exportFormat: ExportFormat,
    propertyName?: string | null
  ) => {
    if (activeBookings.length === 0 && historicalBookings.length === 0) {
      toast.error('Nenhuma reserva disponível para exportar');
      return;
    }

    setIsExporting(true);

    try {
      const processedBookings = processBookings(activeBookings, historicalBookings);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: ptBR });
      
      // Create filename suffix based on property filter
      const propertySuffix = propertyName ? `_${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      
      switch (exportFormat) {
        case 'csv': {
          const csvContent = exportToCSV(processedBookings);
          downloadFile(csvContent, `reservas${propertySuffix}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
          toast.success(`${processedBookings.length} reservas exportadas para CSV${propertyName ? ` (${propertyName})` : ''}`);
          break;
        }
        
        case 'json': {
          const jsonContent = exportToJSON(processedBookings);
          downloadFile(jsonContent, `reservas${propertySuffix}_${timestamp}.json`, 'application/json;charset=utf-8;');
          toast.success(`${processedBookings.length} reservas exportadas para JSON${propertyName ? ` (${propertyName})` : ''}`);
          break;
        }
        
        case 'pdf': {
          const pdf = exportToPDF(processedBookings);
          pdf.save(`relatorio_reservas${propertySuffix}_${timestamp}.pdf`);
          toast.success(`Relatório PDF gerado com ${processedBookings.length} reservas${propertyName ? ` (${propertyName})` : ''}`);
          break;
        }
        
        default:
          throw new Error(`Formato de exportação não suportado: ${exportFormat}`);
      }
    } catch (error) {
      console.error('Erro ao exportar reservas:', error);
      toast.error('Erro ao exportar reservas. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportBookings,
    isExporting
  };
};