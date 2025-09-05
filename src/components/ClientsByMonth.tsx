
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, TrendingUp, Calendar, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

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

interface ClientsByMonthProps {
  clients: ProcessedClient[];
  searchTerm: string;
}

const ClientsByMonth = ({ clients, searchTerm }: ClientsByMonthProps) => {
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openWhatsAppUtil({ phone });
  };

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths);
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey);
    } else {
      newOpenMonths.add(monthKey);
    }
    setOpenMonths(newOpenMonths);
  };

  // Agrupar clientes por mês baseado em suas reservas mais recentes
  const clientsByMonth = clients.reduce((acc, client) => {
    if (!client.bookings.length) return acc;

    // Pegar a reserva mais recente do cliente
    const mostRecentBooking = client.bookings
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())[0];
    
    const bookingDate = parseISO(mostRecentBooking.check_in);
    const monthKey = format(bookingDate, 'yyyy-MM');
    const monthLabel = format(bookingDate, 'MMMM yyyy', { locale: ptBR });

    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        clients: [],
        totalClients: 0,
        totalRevenue: 0,
        totalBookings: 0
      };
    }

    acc[monthKey].clients.push(client);
    acc[monthKey].totalClients += 1;
    acc[monthKey].totalRevenue += client.total_revenue;
    acc[monthKey].totalBookings += client.total_bookings;

    return acc;
  }, {} as Record<string, {
    label: string;
    clients: ProcessedClient[];
    totalClients: number;
    totalRevenue: number;
    totalBookings: number;
  }>);

  // Ordenar meses (mais recente primeiro)
  const sortedMonths = Object.entries(clientsByMonth)
    .sort(([a], [b]) => b.localeCompare(a));

  // Filtrar clientes por termo de busca dentro de cada mês
  const filteredMonths = sortedMonths.map(([monthKey, monthData]) => ({
    monthKey,
    ...monthData,
    clients: monthData.clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(month => month.clients.length > 0);

  if (filteredMonths.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto text-muted-foreground mb-4" size={48} />
        <h3 className="text-lg font-medium text-sage-800 mb-2">Nenhum cliente encontrado</h3>
        <p className="text-muted-foreground">
          {searchTerm 
            ? 'Tente ajustar o termo de busca' 
            : 'Os clientes aparecerão aqui conforme você criar reservas'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredMonths.map(({ monthKey, label, clients, totalClients, totalRevenue, totalBookings }) => (
        <div key={monthKey} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Collapsible
            open={openMonths.has(monthKey)}
            onOpenChange={() => toggleMonth(monthKey)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-sage-50 transition-colors">
                <div className="flex items-center gap-3">
                  {openMonths.has(monthKey) ? (
                    <ChevronDown size={16} className="text-sage-600" />
                  ) : (
                    <ChevronRight size={16} className="text-sage-600" />
                  )}
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-sage-800 capitalize">{label}</h2>
                    <p className="text-sm text-muted-foreground">
                      {totalClients} cliente{totalClients !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-sage-800">{totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Reservas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sage-800">
                      R$ {totalRevenue.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Receita</p>
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="border-t border-sage-100">
                <div className="p-4 space-y-4">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      className="bg-sage-50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sage-800 mb-1">{client.name}</h3>
                          
                          {client.city && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {client.city}, {client.state}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {client.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {client.phone && (
                            <button
                              onClick={(e) => openWhatsApp(client.phone, e)}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <MessageCircle size={18} className="text-green-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div className="p-2 bg-white rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-sage-600 mb-1">
                            <Calendar size={14} />
                          </div>
                          <p className="font-semibold text-sage-800">{client.total_bookings}</p>
                          <p className="text-xs text-muted-foreground">Reservas</p>
                        </div>
                        
                        <div className="p-2 bg-white rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-success mb-1">
                            <TrendingUp size={14} />
                          </div>
                          <p className="font-semibold text-sage-800">
                            R$ {client.total_revenue.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">Faturamento</p>
                        </div>
                        
                        <div className="p-2 bg-white rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-warning mb-1">
                            <TrendingUp size={14} />
                          </div>
                          <p className="font-semibold text-sage-800">
                            R$ {Math.round(client.total_revenue / client.total_bookings).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">Ticket médio</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-sage-800 mb-2">Últimas Reservas</h4>
                        <div className="space-y-1">
                          {client.bookings
                            .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())
                            .slice(0, 2)
                            .map(booking => (
                              <Link
                                key={booking.id}
                                to={`/reserva/${booking.id}`}
                                className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-sage-100 transition-colors"
                              >
                                <span className="text-sm">
                                  {new Date(booking.check_in).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="text-sm font-medium">
                                  R$ {booking.total_value.toLocaleString('pt-BR')}
                                </span>
                              </Link>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  );
};

export default ClientsByMonth;
