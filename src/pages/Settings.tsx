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
    planName: currentTier?.name || 'Gratuito',
    price: currentTier?.price || 0,
    currentPlan: subscriptionData.subscribed ? (currentTier?.name === 'Básico' ? 'basic' : currentTier?.name === 'Pro' ? 'pro' : 'premium') : 'free',
    features: subscriptionData.subscribed ? getFeaturesByTier(currentTier?.name || '') : ['Funcionalidades limitadas'],
    nextBilling: subscriptionData.subscription_end ? new Date(subscriptionData.subscription_end).toLocaleDateString('pt-BR') : null
  };

  function getFeaturesByTier(tierName: string) {
    switch (tierName) {
      case 'Básico':
        return [
          "Até 50 reservas por mês",
          "Calendário básico", 
          "Relatórios simples",
          "Suporte por email"
        ];
      case 'Pro':
        return [
          "Até 200 reservas por mês",
          "Sincronização com Airbnb",
          "Relatórios avançados", 
          "Templates de comunicação",
          "Suporte prioritário"
        ];
      case 'Premium':
        return [
          "Reservas ilimitadas",
          "Todas as integrações",
          "Analytics avançado",
          "Automação completa", 
          "Suporte 24/7",
          "Múltiplas propriedades"
        ];
      default:
        return [];
    }
  }

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 39.90,
      priceId: 'price_1SA8YlKF8m13UKNcHcc17kqM',
      icon: Star,
      popular: false,
      features: [
        "Até 50 reservas por mês",
        "Calendário básico",
        "Relatórios simples", 
        "Suporte por email"
      ]
    },
    {
      id: 'pro', 
      name: 'Pro',
      price: 89.90,
      priceId: 'price_1SA8ZNKF8m13UKNcVbmfzjsA',
      icon: Zap,
      popular: true,
      highlight: 'MAIS POPULAR',
      features: [
        "Até 200 reservas por mês",
        "Sincronização com Airbnb",
        "Relatórios avançados",
        "Templates de comunicação",
        "Suporte prioritário"
      ]
    },
    {
      id: 'premium',
      name: 'Premium', 
      price: 179.90,
      priceId: 'price_1SA8ZxKF8m13UKNciiWekPOI',
      icon: Crown,
      popular: false,
      features: [
        "Reservas ilimitadas",
        "Todas as integrações", 
        "Analytics avançado",
        "Automação completa",
        "Suporte 24/7",
        "Múltiplas propriedades"
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User size={16} />
            Configurações Gerais
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard size={16} />
            Plano e Pagamento
          </TabsTrigger>
        </TabsList>

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
                      {currentSubscription.price > 0 ? `R$ ${currentSubscription.price.toFixed(2)}/mês` : 'Gratuito'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {subscriptionData.subscribed ? 'Ativo' : 'Gratuito'}
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrent = plan.id === currentSubscription.currentPlan;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
                        plan.popular 
                          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/30'
                        } ${isCurrent ? 'bg-muted/30' : 'bg-card'}`}
                    >
                      {plan.highlight && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          {plan.highlight}
                        </Badge>
                      )}
                      
                      <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full"
                        variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                        disabled={isCurrent || subscriptionLoading}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {isCurrent ? 'Plano Atual' : subscriptionLoading ? 'Carregando...' : 'Assinar Agora'}
                      </Button>
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