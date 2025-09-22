import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, CreditCard, Save, Star, Zap, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { ChangePasswordDialog } from '@/components/dialogs/ChangePasswordDialog';
import { ChangeEmailDialog } from '@/components/dialogs/ChangeEmailDialog';
import { ProfilePhotoDialog } from '@/components/dialogs/ProfilePhotoDialog';
import { SessionsDialog } from '@/components/dialogs/SessionsDialog';
import SubscriptionManager from '@/components/SubscriptionManager';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

  const { 
    subscriptionData, 
    loading: subscriptionLoading, 
    createCheckout, 
    openCustomerPortal, 
    getCurrentTier,
    subscriptionTiers 
  } = useSubscription();

  // Get current subscription info
  const currentTier = getCurrentTier();
  const currentSubscription = {
    planName: currentTier?.name || 'Básico',
    price: currentTier?.price || 39.90,
    currentPlan: subscriptionData.subscribed ? (currentTier?.name === 'Básico' ? 'basic' : currentTier?.name === 'Pro' ? 'pro' : 'premium') : 'basic',
    features: subscriptionData.subscribed ? getFeaturesByTier(currentTier?.name || '') : ['15 reservas/mês', '1 propriedade', 'Cadastro de clientes'],
    nextBilling: subscriptionData.subscription_end ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR') : null
  };

  function getFeaturesByTier(tierName: string) {
    switch (tierName) {
      case 'Básico':
        return [
          "Até 15 reservas/mês",
          "Cadastro de clientes"
        ];
      case 'Pro':
        return [
          "Até 35 reservas/mês",
          "Cadastro de clientes",
          "Acesso rápido ao WhatsApp",
          "Dashboard financeiro",
          "Link iCal de exportação (Ordomo → Airbnb)"
        ];
      case 'Premium':
        return [
          "Reservas ilimitadas",
          "Cadastro de clientes",
          "Acesso rápido ao WhatsApp",
          "Dashboard financeiro", 
          "Exportação de relatórios",
          "Integração completa com Airbnb (Airbnb ↔ Ordomo bidirecional)",
          "Multi-chalé",
          "Suporte prioritário"
        ];
      default:
        return [];
    }
  }

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 39.00,
      priceId: 'price_1SAAe12cr9j2Q543DqSvOX1K',
      icon: Star,
      popular: false,
      features: [
        "Até 15 reservas/mês",
        "Cadastro de clientes"
      ]
    },
    {
      id: 'pro', 
      name: 'Pro',
      price: 89.00,
      priceId: 'price_1SAAeT2cr9j2Q5434hjEsJY7',
      icon: Zap,
      popular: false,
      highlight: 'INDICADO PARA VOCÊ',
      features: [
        "Até 35 reservas/mês",
        "Cadastro de clientes",
        "Acesso rápido ao WhatsApp",
        "Dashboard financeiro",
        "Link iCal de exportação (Ordomo → Airbnb)"
      ]
    },
    {
      id: 'premium',
      name: 'Premium', 
      price: 179.00,
      priceId: 'price_1SAAep2cr9j2Q5438bA7nlEV',
      icon: Crown,
      popular: true,
      highlight: 'MAIS POPULAR',
      features: [
        "Reservas ilimitadas",
        "Cadastro de clientes",
        "Acesso rápido ao WhatsApp",
        "Dashboard financeiro", 
        "Exportação de relatórios",
        "Integração completa com Airbnb (Airbnb ↔ Ordomo bidirecional)",
        "Multi-chalé",
        "Suporte prioritário"
      ]
    }
  ];

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement user profile update
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      toast({
        title: "Configurações Salvas",
        description: "Suas configurações gerais foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: any) => {
    if (currentSubscription.currentPlan === plan.id) {
      toast({
        title: "Plano Atual",
        description: `Você já está no plano ${plan.name}.`,
      });
      return;
    }

    try {
      await createCheckout(plan.priceId);
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o checkout do Stripe.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar assinatura.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o portal de assinatura.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao acessar portal de assinatura.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta e preferências do sistema.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted p-1 rounded-lg">
            <TabsTrigger 
              value="general"
              className="text-sm font-medium rounded-md px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger 
              value="subscription"
              className="text-sm font-medium rounded-md px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Assinatura
            </TabsTrigger>
            <TabsTrigger 
              value="billing"
              className="text-sm font-medium rounded-md px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Planos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Perfil da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    defaultValue="João Silva"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      defaultValue="joao@email.com"
                      disabled
                      className="bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailDialog(true)}
                    >
                      Alterar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                <div>
                  <h3 className="font-medium">Senha</h3>
                  <p className="text-sm text-muted-foreground">
                    Última alteração há 30 dias
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Alterar Senha
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                <div>
                  <h3 className="font-medium">Sessões Ativas</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie dispositivos conectados à sua conta
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSessionsDialog(true)}
                >
                  Ver Sessões
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={isLoading} className="flex items-center gap-2">
              <Save size={16} />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Star size={16} className="text-primary md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">{currentSubscription.planName}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {currentSubscription.price > 0 ? `R$ ${currentSubscription.price.toFixed(2)}/mês` : 'R$ 39,90/mês'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {subscriptionData.subscribed ? 'Ativo' : 'Básico'}
                  </Badge>
                  {currentSubscription.nextBilling && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Próxima cobrança: {currentSubscription.nextBilling}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 md:mt-4">
                <p className="text-xs md:text-sm font-medium mb-2">Recursos inclusos:</p>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                  {currentSubscription.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {subscriptionData.subscribed && (
                <div className="mt-3 md:mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription} 
                    disabled={subscriptionLoading} 
                    className="text-xs md:text-sm h-8 md:h-9"
                  >
                    {subscriptionLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Planos Disponíveis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Escolha o plano que melhor se adapta às suas necessidades
              </p>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 gap-6 items-stretch">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrent = plan.id === currentSubscription.currentPlan;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-xl p-6 transition-all duration-200 hover:shadow-lg h-full flex flex-col min-h-[560px] pt-14 ${
                        plan.popular 
                          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/30'
                        } ${isCurrent ? 'bg-muted/30' : 'bg-card'}`}
                    >
                        {plan.highlight && (
                          <Badge className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1">
                            {plan.highlight}
                          </Badge>
                        )}
                        
                        {isCurrent && (
                          <Badge className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs">
                            Ativo
                          </Badge>
                        )}

                        {/* Header section with icon and title */}
                        <div className="text-center mb-6 space-y-3">
                          <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-primary/10">
                              <Icon size={32} className="text-primary" />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                            <div className="space-y-1">
                              <p className="text-3xl font-bold text-foreground">
                                R$ {plan.price.toFixed(2).replace('.', ',')}
                                <span className="text-base font-normal text-muted-foreground">/mês</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Features list - flex-grow to push button to bottom */}
                        <div className="space-y-3 flex-grow">
                          {/* All available features for comparison */}
                          {[
                            plan.id === 'basic' ? 'Até 15 reservas/mês' : plan.id === 'pro' ? 'Até 35 reservas/mês' : 'Reservas ilimitadas',
                            'Cadastro de clientes', 
                            'Acesso rápido ao WhatsApp',
                            'Dashboard financeiro',
                            'Exportação de relatórios',
                            plan.id === 'basic' ? 'Integração Airbnb (nenhuma)' : plan.id === 'pro' ? 'Integração Airbnb (Airbnb → Ordomo)' : 'Integração completa com Airbnb (Airbnb ↔ Ordomo bidirecional)',
                            'Link iCal de exportação (Ordomo → Airbnb)',
                            'Multi-chalé',
                            'Suporte prioritário'
                          ].map((feature, index) => {
                            let isIncluded = false;
                            
                            // Define what's included in each plan
                            if (plan.id === 'basic') {
                              isIncluded = index <= 1; // Apenas reservas e cadastro
                            } else if (plan.id === 'pro') {
                              isIncluded = index <= 1 || index === 2 || index === 3 || index === 6; // reservas, cadastro, whatsapp, dashboard, ical
                            } else if (plan.id === 'premium') {
                              isIncluded = true; // Todos os recursos
                            }
                            
                            return (
                              <div key={index} className="flex items-start gap-3 text-sm">
                                <span className="text-base mt-0.5 flex-none">
                                  {isIncluded ? '✅' : '❌'}
                                </span>
                                <span className={`${
                                  isIncluded 
                                    ? 'text-foreground' 
                                    : 'text-muted-foreground'
                                } whitespace-normal break-normal leading-relaxed`}
                                >
                                  {feature}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action button - positioned at bottom */}
                        <div className="mt-6">
                          <Button
                            className={`w-full h-11 font-medium text-base ${
                              plan.popular 
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                                : ''
                            }`}
                            variant={
                              isCurrent 
                                ? 'secondary' 
                                : plan.popular 
                                  ? 'default' 
                                  : 'outline'
                            }
                            disabled={isCurrent || subscriptionLoading}
                            onClick={() => handleSubscribe(plan)}
                          >
                            {isCurrent ? 'Plano Atual' : subscriptionLoading ? 'Carregando...' : 'Começar'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum pagamento encontrado</p>
                <p className="text-sm">Seus pagamentos aparecerão aqui após a primeira cobrança</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
      
      <ChangeEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        currentEmail="joao@email.com"
      />
      
      <ProfilePhotoDialog
        open={showProfilePhoto}
        onOpenChange={setShowProfilePhoto}
        onAvatarUpdate={() => {}}
      />
      
      <SessionsDialog
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
      />
    </div>
  );
};

export default Settings;