
import UserMenu from '@/components/UserMenu';

const DashboardHeader = () => {
  return (
    <header className="text-center py-6 relative">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>
      <div className="flex items-center justify-center mb-3">
        <img 
          src="/lovable-uploads/d08d425b-8432-4ab7-a851-163f5a72bd81.png" 
          alt="ORDOMO Logo" 
          className="h-24 object-contain"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Sistema de Gestão de Reservas
      </p>
    </header>
  );
};

export default DashboardHeader;
