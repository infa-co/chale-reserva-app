
import { Bell, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const NotificationCenter = () => {
  const { 
    notifications, 
    getActionRequiredNotifications, 
    dismissNotification,
    urgentCount 
  } = useNotifications();

  const actionRequired = getActionRequiredNotifications();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'checkin_today':
      case 'checkin_tomorrow':
        return <CheckCircle size={16} />;
      case 'checkout_today':
      case 'checkout_overdue':
        return <Clock size={16} />;
      case 'payment_pending':
        return <AlertTriangle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-sage-600" />
          <h3 className="font-semibold text-sage-800">Notificações</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma notificação no momento
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-sage-600" />
          <h3 className="font-semibold text-sage-800">Notificações</h3>
          {urgentCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {urgentCount} urgente{urgentCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {notifications.length} total
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notifications.slice(0, 5).map(notification => (
          <div 
            key={notification.id}
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
          >
            <div className={`p-1.5 rounded-full ${getPriorityColor(notification.priority)}`}>
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm text-sage-800">
                  {notification.title}
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                >
                  {notification.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Check-in: {format(parseISO(notification.booking.check_in), 'dd/MM', { locale: ptBR })}
                </span>
                <span>•</span>
                <span>R$ {notification.booking.total_value.toLocaleString('pt-BR')}</span>
              </div>
              
              {notification.actionRequired && (
                <div className="flex gap-2 mt-2">
                  <Link to={`/reserva/${notification.booking.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Ver Reserva
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissNotification(notification.id)}
              className="p-1 h-auto text-muted-foreground hover:text-sage-800"
            >
              <X size={14} />
            </Button>
          </div>
        ))}
        
        {notifications.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              +{notifications.length - 5} notificações adicionais
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
