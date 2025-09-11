
import { useState } from 'react';
import { ChevronRight, Clock, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useBookingWorkflow, BookingState } from '@/hooks/useBookingWorkflow';
import { Booking } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingWorkflowProps {
  booking: Booking;
}

export const BookingWorkflow = ({ booking }: BookingWorkflowProps) => {
  const {
    getStateConfig,
    getAvailableActions,
    getAutoTransitions,
    executeAction,
    executeAutoTransitions
  } = useBookingWorkflow();

  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentState = booking.status as BookingState;
  const stateConfig = getStateConfig(currentState);
  const availableActions = getAvailableActions(booking);
  const autoTransitions = getAutoTransitions(booking);

  const handleAction = async (actionId: string) => {
    setIsProcessing(true);
    await executeAction(booking, actionId);
    setIsProcessing(false);
  };

  const handleAutoTransitions = async () => {
    setIsProcessing(true);
    await executeAutoTransitions(booking);
    setIsProcessing(false);
  };

  if (!stateConfig) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="font-semibold text-sage-800 mb-4">Status da Reserva</h3>
      
      {/* Estado Atual */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${stateConfig.color}`}>
          {stateConfig.label}
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {stateConfig.description}
        </span>
      </div>


      {/* Ações Disponíveis */}
      {availableActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-sage-800 mb-3">Ações Disponíveis:</h4>
          
          {availableActions.map(action => (
            <div key={action.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm text-sage-800">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              
              {action.requiresConfirmation ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={action.nextState === 'cancelled' ? 'destructive' : 'default'}
                      disabled={isProcessing}
                    >
                      {action.nextState === 'cancelled' ? (
                        <AlertTriangle size={14} className="mr-1" />
                      ) : (
                        <CheckCircle size={14} className="mr-1" />
                      )}
                      {action.label}
                    </Button>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja {action.label.toLowerCase()}? 
                        {action.nextState === 'cancelled' && ' Esta ação não pode ser desfeita.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction(action.id)}
                        className={action.nextState === 'cancelled' ? 'bg-destructive hover:bg-destructive/90' : ''}
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleAction(action.id)}
                  disabled={isProcessing}
                  variant={action.nextState === 'cancelled' ? 'destructive' : 'default'}
                >
                  <CheckCircle size={14} className="mr-1" />
                  {action.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {availableActions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma ação disponível no momento
        </p>
      )}
    </div>
  );
};
