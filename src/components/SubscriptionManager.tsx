import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Calendar, AlertTriangle, RefreshCw, Settings, X } from 'lucide-react';

const SubscriptionManager = () => {
  const { toast } = useToast();
  const [isCanceling, setIsCanceling] = useState(false);
  
  const { 
    subscriptionData, 
    loading, 
    openCustomerPortal, 
    cancelSubscription,
    refreshSubscription,
    getCurrentTier,
    createCheckout,
    subscriptionTiers 
  } = useSubscription();

  const currentTier = getCurrentTier();

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const success = await cancelSubscription();
      if (success) {
        toast({
          title: "Assinatura Cancelada",
          description: "Sua assinatura será cancelada no final do período atual. Você ainda terá acesso até " + 
            (subscriptionData.subscription_end ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR') : ''),
        });
      }
    } finally {
      setIsCanceling(false);
    }
  };

  const handleUpgrade = (priceId: string) => {
    createCheckout(priceId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!subscriptionData.subscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Nenhuma Assinatura Ativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Você está usando o plano gratuito. Faça upgrade para desbloquear recursos premium.
          </p>
          <Button onClick={() => createCheckout(subscriptionTiers.pro.price_id)}>
            Ver Planos Disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Status da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{currentTier?.name || 'Plano Ativo'}</h3>
              <p className="text-muted-foreground">
                R$ {currentTier?.price?.toFixed(2) || '0,00'}/mês
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Próxima Cobrança</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionData.subscription_end 
                    ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Renovação</p>
                <p className="text-sm text-muted-foreground">Automática</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={openCustomerPortal}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Portal do Cliente
            </Button>

            <Button 
              variant="outline" 
              onClick={refreshSubscription}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Atualizar Status
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Opções de Plano</h4>
            
            {/* Upgrade Options */}
            {currentTier?.name !== 'Premium' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Faça upgrade para acessar mais recursos
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(subscriptionTiers).map((tier) => {
                    if (tier.price > (currentTier?.price || 0)) {
                      return (
                        <Button
                          key={tier.price_id}
                          variant="default"
                          size="sm"
                          onClick={() => handleUpgrade(tier.price_id)}
                        >
                          Upgrade para {tier.name}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Cancel Subscription */}
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle size={20} className="text-destructive" />
                      Cancelar Assinatura
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Tem certeza que deseja cancelar sua assinatura? 
                      </p>
                      <p>
                        <strong>Importante:</strong> Você manterá o acesso a todos os recursos até o final do período atual 
                        ({subscriptionData.subscription_end 
                          ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR')
                          : 'final do ciclo'
                        }).
                      </p>
                      <p>
                        Após essa data, sua conta será convertida para o plano gratuito.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isCanceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Cobrança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">Gerencie métodos de pagamento</p>
            <p className="text-sm mb-4">
              Use o Portal do Cliente para atualizar cartões, visualizar faturas e histórico de pagamentos.
            </p>
            <Button 
              variant="outline" 
              onClick={openCustomerPortal}
              disabled={loading}
            >
              Abrir Portal de Cobrança
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;