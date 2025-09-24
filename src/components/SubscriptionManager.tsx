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

  const handleOpenCustomerPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal do cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const result = await cancelSubscription();
      if (result?.success) {
        toast({
          title: "✅ Assinatura cancelada com sucesso",
          description: `Você manterá acesso completo até ${result.currentPeriodEnd ? new Date(result.currentPeriodEnd).toLocaleDateString('pt-BR') : 'o final do período'}. Sua assinatura está marcada para cancelamento.`,
        });
        await refreshSubscription(); // Refresh para mostrar o status atualizado
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
            Você está usando o plano básico. Faça upgrade para desbloquear recursos premium.
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
          {subscriptionData.cancel_at_period_end && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ✅ <strong>Você tem acesso até {subscriptionData.subscription_end 
                  ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR') 
                  : 'o final do período'}</strong>
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Sua assinatura está marcada para cancelamento.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{currentTier?.name || 'Plano Ativo'}</h3>
              <p className="text-muted-foreground">
                R$ {currentTier?.price?.toFixed(2) || '0,00'}/mês
              </p>
            </div>
            {subscriptionData.cancel_at_period_end ? (
              <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
                Cancelada
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {subscriptionData.cancel_at_period_end ? 'Acesso até' : 'Próxima Cobrança'}
                </p>
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
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground border-muted-foreground/30 hover:border-foreground/30"
                  >
                    <X size={16} />
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle size={24} className="text-orange-600" />
                    </div>
                    <AlertDialogTitle className="text-xl font-semibold">
                      ❗ Você está prestes a cancelar sua assinatura
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-3 text-base">
                      <p className="text-foreground">
                        Você manterá acesso ao Ordomo até o final do período já pago 
                        <span className="font-semibold text-primary">
                          {subscriptionData.subscription_end 
                            ? ` (${new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR')})`
                            : ''
                          }
                        </span>.
                      </p>
                      <p className="text-muted-foreground">
                        Sem cobranças futuras. Deseja continuar?
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0">
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isCanceling ? 'Cancelando...' : '❌ Cancelar assinatura'}
                    </AlertDialogAction>
                    <AlertDialogCancel className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600">
                      ✅ Manter plano
                    </AlertDialogCancel>
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium">Portal do Cliente</p>
                <p className="text-sm text-muted-foreground">
                  Gerencie métodos de pagamento, visualize faturas e histórico
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleOpenCustomerPortal}
              className="w-full"
            >
              <Settings size={16} className="mr-2" />
              Abrir Portal de Cobrança
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              O portal será aberto em uma nova aba e gerenciado pelo Stripe
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;