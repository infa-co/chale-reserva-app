
import { useState } from 'react';
import { useBookings } from '@/contexts/BookingContext';
import { Booking } from '@/types/booking';
import { differenceInDays, parseISO, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

export type BookingState = 
  | 'requested'     // Solicitada (novo estado)
  | 'pending'       // Aguardando pagamento
  | 'confirmed'     // Confirmada e paga
  | 'checked_in'    // Hóspede fez check-in (novo estado)
  | 'active'        // Estadia em andamento (novo estado)
  | 'checked_out'   // Check-out realizado (novo estado)
  | 'completed'     // Finalizada (novo estado)
  | 'cancelled';    // Cancelada

interface WorkflowAction {
  id: string;
  label: string;
  nextState: BookingState;
  description: string;
  requiresConfirmation: boolean;
  autoTrigger?: (booking: Booking) => boolean;
}

interface StateConfig {
  state: BookingState;
  label: string;
  description: string;
  color: string;
  actions: WorkflowAction[];
  autoTransitions: WorkflowAction[];
}

export const useBookingWorkflow = () => {
  const { updateBooking } = useBookings();
  
  const stateConfigs: StateConfig[] = [
    {
      state: 'requested',
      label: 'Solicitada',
      description: 'Reserva solicitada pelo cliente',
      color: 'bg-gray-100 text-gray-700',
      actions: [
        {
          id: 'approve',
          label: 'Aprovar e Aguardar Pagamento',
          nextState: 'pending',
          description: 'Aprovar reserva e enviar cobrança',
          requiresConfirmation: false
        },
        {
          id: 'reject',
          label: 'Rejeitar Solicitação',
          nextState: 'cancelled',
          description: 'Rejeitar a solicitação de reserva',
          requiresConfirmation: true
        }
      ],
      autoTransitions: []
    },
    {
      state: 'pending',
      label: 'Aguardando Pagamento',
      description: 'Pagamento pendente',
      color: 'bg-warning-light text-warning',
      actions: [
        {
          id: 'confirm_payment',
          label: 'Confirmar Pagamento',
          nextState: 'confirmed',
          description: 'Marcar pagamento como recebido',
          requiresConfirmation: false
        },
        {
          id: 'cancel_no_payment',
          label: 'Cancelar por Falta de Pagamento',
          nextState: 'cancelled',
          description: 'Cancelar por não pagamento',
          requiresConfirmation: true
        }
      ],
      autoTransitions: []
    },
    {
      state: 'confirmed',
      label: 'Confirmada',
      description: 'Reserva confirmada e paga',
      color: 'bg-success-light text-success',
      actions: [
        {
          id: 'checkin',
          label: 'Fazer Check-in',
          nextState: 'checked_in',
          description: 'Hóspede chegou e fez check-in',
          requiresConfirmation: false
        },
        {
          id: 'cancel_confirmed',
          label: 'Cancelar Reserva',
          nextState: 'cancelled',
          description: 'Cancelar reserva confirmada',
          requiresConfirmation: true
        }
      ],
      autoTransitions: [
        {
          id: 'auto_checkin',
          label: 'Check-in Automático',
          nextState: 'checked_in',
          description: 'Check-in automático no dia',
          requiresConfirmation: false,
          autoTrigger: (booking) => isToday(parseISO(booking.check_in))
        }
      ]
    },
    {
      state: 'checked_in',
      label: 'Check-in Realizado',
      description: 'Hóspede fez check-in',
      color: 'bg-blue-100 text-blue-700',
      actions: [
        {
          id: 'start_stay',
          label: 'Iniciar Estadia',
          nextState: 'active',
          description: 'Estadia em andamento',
          requiresConfirmation: false
        },
        {
          id: 'checkout_early',
          label: 'Check-out Antecipado',
          nextState: 'checked_out',
          description: 'Check-out antes da data prevista',
          requiresConfirmation: false
        }
      ],
      autoTransitions: [
        {
          id: 'auto_active',
          label: 'Ativar Estadia',
          nextState: 'active',
          description: 'Ativar automaticamente após check-in',
          requiresConfirmation: false,
          autoTrigger: () => true // Transição imediata
        }
      ]
    },
    {
      state: 'active',
      label: 'Estadia Ativa',
      description: 'Hóspede está no chalé',
      color: 'bg-green-100 text-green-700',
      actions: [
        {
          id: 'checkout',
          label: 'Fazer Check-out',
          nextState: 'checked_out',
          description: 'Hóspede fez check-out',
          requiresConfirmation: false
        }
      ],
      autoTransitions: [
        {
          id: 'auto_checkout',
          label: 'Check-out Automático',
          nextState: 'checked_out',
          description: 'Check-out automático no dia',
          requiresConfirmation: false,
          autoTrigger: (booking) => isToday(parseISO(booking.check_out))
        }
      ]
    },
    {
      state: 'checked_out',
      label: 'Check-out Realizado',
      description: 'Hóspede fez check-out',
      color: 'bg-purple-100 text-purple-700',
      actions: [
        {
          id: 'complete',
          label: 'Finalizar Reserva',
          nextState: 'completed',
          description: 'Marcar como finalizada',
          requiresConfirmation: false
        }
      ],
      autoTransitions: [
        {
          id: 'auto_complete',
          label: 'Finalizar Automaticamente',
          nextState: 'completed',
          description: 'Finalizar após 1 dia do checkout',
          requiresConfirmation: false,
          autoTrigger: (booking) => {
            const checkoutDate = parseISO(booking.check_out);
            return differenceInDays(new Date(), checkoutDate) >= 1;
          }
        }
      ]
    },
    {
      state: 'completed',
      label: 'Finalizada',
      description: 'Reserva completamente finalizada',
      color: 'bg-slate-100 text-slate-700',
      actions: [],
      autoTransitions: []
    },
    {
      state: 'cancelled',
      label: 'Cancelada',
      description: 'Reserva cancelada',
      color: 'bg-danger-light text-danger',
      actions: [],
      autoTransitions: []
    }
  ];

  const getStateConfig = (state: BookingState) => {
    return stateConfigs.find(config => config.state === state);
  };

  const getAvailableActions = (booking: Booking) => {
    const currentState = booking.status as BookingState;
    const config = getStateConfig(currentState);
    return config?.actions || [];
  };

  const getAutoTransitions = (booking: Booking) => {
    const currentState = booking.status as BookingState;
    const config = getStateConfig(currentState);
    
    return (config?.autoTransitions || []).filter(transition => 
      transition.autoTrigger && transition.autoTrigger(booking)
    );
  };

  const executeAction = async (booking: Booking, actionId: string) => {
    const actions = getAvailableActions(booking);
    const action = actions.find(a => a.id === actionId);
    
    if (!action) {
      toast.error('Ação não encontrada');
      return false;
    }

    try {
      await updateBooking(booking.id, { status: action.nextState });
      toast.success(`Status alterado para: ${getStateConfig(action.nextState)?.label}`);
      return true;
    } catch (error) {
      toast.error('Erro ao alterar status');
      return false;
    }
  };

  const executeAutoTransitions = async (booking: Booking) => {
    const autoTransitions = getAutoTransitions(booking);
    
    for (const transition of autoTransitions) {
      await executeAction(booking, transition.id);
    }
  };

  const getNextStates = (currentState: BookingState) => {
    const config = getStateConfig(currentState);
    return config?.actions.map(action => ({
      state: action.nextState,
      label: getStateConfig(action.nextState)?.label || action.nextState,
      action: action.label
    })) || [];
  };

  const isValidTransition = (fromState: BookingState, toState: BookingState) => {
    const config = getStateConfig(fromState);
    return config?.actions.some(action => action.nextState === toState) || false;
  };

  return {
    stateConfigs,
    getStateConfig,
    getAvailableActions,
    getAutoTransitions,
    executeAction,
    executeAutoTransitions,
    getNextStates,
    isValidTransition
  };
};
