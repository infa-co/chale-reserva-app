import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const SubscriptionSection = () => {
  const { user, hasActiveSubscription } = useAuth();
  const { 
    subscriptionData, 
    loading, 
    createCheckout, 
    openCustomerPortal, 
    getCurrentTier,
    subscriptionTiers
  } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Assinatura</h2>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e escolha o plano ideal para seu negócio.
        </p>
      </div>

      {subscriptionData.subscribed && currentTier && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Plano Atual: {currentTier.name}</CardTitle>
            <CardDescription className="text-green-600">
              Sua assinatura está ativa
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={openCustomerPortal} 
              variant="outline" 
              className="border-green-300 text-green-700"
            >
              Gerenciar Assinatura
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
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
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-slate-900">
                  R$ {plan.price.toFixed(2)}
                  <span className="text-sm font-normal text-slate-600">/mês</span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {features[tier as keyof typeof features].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={openCustomerPortal}
                  >
                    Gerenciar Plano
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

      <div className="text-center">
        <p className="text-slate-600 mb-2">
          Todas as assinaturas incluem 7 dias de teste grátis
        </p>
        <p className="text-sm text-slate-500">
          Cancele a qualquer momento. Sem taxas de cancelamento.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSection;