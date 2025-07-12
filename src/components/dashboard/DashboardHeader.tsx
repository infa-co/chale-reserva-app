
import UserMenu from '@/components/UserMenu';

const DashboardHeader = () => {
  return (
    <header className="text-center py-6 relative">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>
      <div className="flex items-center justify-center mb-3">
        <img 
          src="/lovable-uploads/4c0333c9-dada-46c7-8544-352d42f7c0d2.png" 
          alt="ORDOMO Logo" 
          className="h-32 object-contain"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Sistema de Gestão de Reservas
      </p>
    </header>
  );
};

export default DashboardHeader;
