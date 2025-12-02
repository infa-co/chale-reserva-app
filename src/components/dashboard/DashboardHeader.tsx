import { memo } from 'react';
import UserMenu from '@/components/UserMenu';
import PropertySwitcher from '@/components/PropertySwitcher';

const DashboardHeader = memo(() => {
  return (
    <header className="py-4 relative">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <img 
          src="/lovable-uploads/4c0333c9-dada-46c7-8544-352d42f7c0d2.png" 
          alt="ORDOMO Logo" 
          className="h-24 md:h-28 object-contain"
        />
        
        <PropertySwitcher />
        
        <p className="text-sm text-muted-foreground">
          Sistema de Gestão de Reservas
        </p>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
