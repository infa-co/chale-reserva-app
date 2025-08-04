import { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBookings } from '@/contexts/BookingContext';
import { useOptimizedClients } from '@/hooks/useOptimizedClients';
import { useDebounce } from '@/hooks/useDebounce';
import ClientsByMonthOptimized from '@/components/ClientsByMonthOptimized';
import ClientExportDialog from '@/components/ClientExportDialog';

const OptimizedClients = () => {
  const { bookings } = useBookings();
  const { clients, loading } = useOptimizedClients(bookings);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ),
    [clients, debouncedSearchTerm]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-sage-800">Clientes</h1>
          <ClientExportDialog 
            clients={filteredClients} 
            filteredCount={filteredClients.length}
          />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </header>

      <ClientsByMonthOptimized clients={filteredClients} searchTerm={debouncedSearchTerm} />
    </div>
  );
};

export default OptimizedClients;