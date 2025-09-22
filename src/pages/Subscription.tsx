import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Subscription = () => {
  const { user, hasActiveSubscription } = useAuth();
  const { 
    subscriptionData, 
    loading, 
    createCheckout, 
    openCustomerPortal, 
    getCurrentTier,
    subscriptionTiers,
    checkSubscription 
  } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check for payment success URL parameter and refresh subscription
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (success === 'true' || sessionId) {
      toast.success('Pagamento realizado com sucesso! Verificando assinatura...');
      
      // Force refresh subscription status after payment with multiple attempts
      const refreshSubscription = async () => {
        // Wait 2 seconds first to allow Stripe to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try multiple times with delays
        for (let i = 0; i < 5; i++) {
          console.log(`Tentativa ${i + 1} de verificar assinatura`);
          await checkSubscription();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      };
      
      refreshSubscription();
      
      // Clean URL
      window.history.replaceState({}, '', '/assinatura');
    }
  }, [checkSubscription]);

  // Debug: Log current subscription state
  useEffect(() => {
    console.log('Subscription state:', { 
      subscriptionData, 
      hasActiveSubscription, 
      loading,
      user: user?.email 
    });
  }, [subscriptionData, hasActiveSubscription, loading, user]);

  // Redirect to dashboard if user has active subscription
  if (hasActiveSubscription) {
    console.log('Redirecting to dashboard - user has active subscription');
    return <Navigate to="/" replace />;
  }

  const currentTier = getCurrentTier();

  const features = {
    basic: [
      "Até 50 reservas por mês",
      "Calendário básico",
      "Relatórios simples",
      "Suporte por email"
    ],
    pro: [
      "Até 200 reservas por mês", 
      "Sincronização com Airbnb",
      "Relatórios avançados",
      "Templates de comunicação",
      "Suporte prioritário"
    ],
    premium: [
      "Reservas ilimitadas",
      "Todas as integrações",
      "Analytics avançado",
      "Automação completa",
      "Suporte 24/7",
      "Múltiplas propriedades"
    ]
  };

  const icons = {
    basic: <Star className="h-6 w-6 text-blue-600" />,
    pro: <Zap className="h-6 w-6 text-purple-600" />,
    premium: <Crown className="h-6 w-6 text-yellow-600" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Gerencie suas reservas com eficiência. Escolha o plano que melhor se adapta ao seu negócio.
          </p>
        </div>

        {subscriptionData.subscribed && currentTier && (
          <Card className="max-w-md mx-auto mb-8 border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800">Plano Atual: {currentTier.name}</CardTitle>
              <CardDescription className="text-green-600">
                Sua assinatura está ativa
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center flex-col gap-2">
              <p className="text-sm text-green-600 text-center">
                Para gerenciar sua assinatura, entre em contato com nosso suporte
              </p>
              <Button 
                onClick={() => window.open('mailto:suporte@ordomo.com.br', '_blank')} 
                variant="outline" 
                className="border-green-300 text-green-700"
              >
                Contatar Suporte
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(subscriptionTiers).map(([tier, plan]) => {
            const isCurrentPlan = currentTier?.product_id === plan.product_id;
            const isPremium = tier === 'premium';
            
            return (
              <Card 
                key={tier} 
                className={`relative ${isPremium ? 'border-yellow-300 shadow-lg scale-105' : 'border-slate-200'} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPremium && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {icons[tier as keyof typeof icons]}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-3xl font-bold text-slate-900">
                    R$ {plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-slate-600">/mês</span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {features[tier as keyof typeof features].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open('mailto:suporte@ordomo.com.br', '_blank')}
                    >
                      Contatar Suporte
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isPremium ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                      onClick={async () => {
                        setCheckoutLoading(plan.price_id);
                        await createCheckout(plan.price_id);
                        setCheckoutLoading(null);
                      }}
                      disabled={loading || checkoutLoading === plan.price_id}
                    >
                      {checkoutLoading === plan.price_id ? 'Redirecionando...' : loading ? 'Carregando...' : 'Assinar Agora'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            Todas as assinaturas incluem 7 dias de teste grátis
          </p>
          <p className="text-sm text-slate-500">
            Cancele a qualquer momento. Sem taxas de cancelamento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;