
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, List, Users, Calendar } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/nova-reserva', icon: Plus, label: 'Nova' },
    { path: '/reservas', icon: List, label: 'Reservas' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-sage-600 bg-sage-50' 
                  : 'text-muted-foreground hover:text-sage-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
