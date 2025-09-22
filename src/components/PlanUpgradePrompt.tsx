import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, ArrowRight, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanRestrictions } from "@/hooks/usePlanRestrictions";
import { toast } from "sonner";

interface PlanUpgradePromptProps {
  feature: string;
  description?: string;
  onClose?: () => void;
  compact?: boolean;
}

export const PlanUpgradePrompt = ({ 
  feature, 
  description, 
  onClose,
  compact = false 
}: PlanUpgradePromptProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createCheckout } = useSubscription();
  const { getUpgradeMessage, getNextPlanId, currentPlan } = usePlanRestrictions();

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 39,
      priceId: 'price_1SAAe12cr9j2Q543DqSvOX1K',
      icon: Star,
      color: 'text-yellow-600',
      features: ['15 reservas/mês', 'Cadastro de clientes']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 89,
      priceId: 'price_1SAAeT2cr9j2Q5434hjEsJY7',
      icon: Zap,
      color: 'text-blue-600',
      features: ['35 reservas/mês', 'WhatsApp', 'Dashboard financeiro', 'iCal export']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 179,
      priceId: 'price_1SAAep2cr9j2Q5438bA7nlEV',
      icon: Crown,
      color: 'text-purple-600',
      features: ['Reservas ilimitadas', 'Todos os recursos', 'Multi-chalé', 'Suporte prioritário']
    }
  ];

  const nextPlanId = getNextPlanId();
  const suggestedPlan = plans.find(p => p.id === nextPlanId);

  const handleUpgrade = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsLoading(true);
    try {
      await createCheckout(plan.priceId);
      toast.success('Redirecionando para o checkout...');
    } catch (error) {
      toast.error('Erro ao processar upgrade');
    } finally {
      setIsLoading(false);
    }
  };

  if (compact && suggestedPlan) {
    return (
      <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <suggestedPlan.icon className={`h-5 w-5 ${suggestedPlan.color}`} />
              <div>
                <p className="text-sm font-medium">
                  {getUpgradeMessage(feature)}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                R$ {suggestedPlan.price}/mês
              </Badge>
              <Button 
                size="sm" 
                onClick={() => handleUpgrade(suggestedPlan.id)}
                disabled={isLoading}
                className="h-8"
              >
                {isLoading ? 'Carregando...' : 'Upgrade'}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Upgrade Necessário
        </CardTitle>
        <p className="text-muted-foreground">
          {getUpgradeMessage(feature)}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {plans
            .filter(plan => {
              // Mostra apenas planos superiores ao atual
              const planOrder = ['free', 'basic', 'pro', 'premium'];
              const currentIndex = planOrder.indexOf(currentPlan);
              const planIndex = planOrder.indexOf(plan.id);
              return planIndex > currentIndex;
            })
            .map((plan) => {
              const Icon = plan.icon;
              const isRecommended = plan.id === nextPlanId;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all cursor-pointer hover:shadow-md ${
                    isRecommended ? 'border-primary shadow-sm' : 'border-border'
                  }`}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Recomendado
                    </Badge>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${plan.color}`} />
                        <div>
                          <h4 className="font-semibold">{plan.name}</h4>
                          <p className="text-lg font-bold">
                            R$ {plan.price}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading}
                        variant={isRecommended ? "default" : "outline"}
                      >
                        {isLoading ? 'Carregando...' : 'Escolher'}
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
        
        {onClose && (
          <div className="text-center">
            <Button variant="ghost" onClick={onClose}>
              Continuar com plano atual
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};