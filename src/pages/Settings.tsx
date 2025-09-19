import React, { useState, useEffect } from 'react';
import { User, CreditCard, Save, Camera, Globe, Shield, Crown, Zap, Star, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChangePasswordDialog } from '@/components/dialogs/ChangePasswordDialog';
import { ChangeEmailDialog } from '@/components/dialogs/ChangeEmailDialog';
import { SessionsDialog } from '@/components/dialogs/SessionsDialog';
import { ProfilePhotoDialog } from '@/components/dialogs/ProfilePhotoDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Ensure client-only components (Radix Tabs, Dialog) render after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    displayName: user?.user_metadata?.display_name || '',
    phone: '',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
  });

  // Load user avatar on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data && (data as any).avatar_url) {
          setAvatarUrl((data as any).avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadUserProfile();
  }, [user]);

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const [subscription] = useState({
    currentPlan: 'basic',
    planName: 'Plano Básico',
    price: 29,
    features: ['Até 5 reservas', 'Cadastro de clientes', 'Dashboard básico'],
    nextBilling: null,
    isActive: true
  });

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 39,
      period: 'por mês',
      icon: Star,
      subtitle: '👉 Para quem está começando agora',
      description: 'Ideal para chalés e hospedagens que estão dando os primeiros passos no aluguel por temporada.',
      bookingLimit: '15 reservas por mês',
      features: [
        'Até 15 reservas por mês',
        'Cadastro de clientes',
        'Dashboard básico',
        'Gestão de hóspedes',
        'Controle financeiro básico',
        'Calendário básico'
      ],
      popular: false,
      highlight: null
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 89,
      period: 'por mês',
      icon: Crown,
      subtitle: '👉 Para quem já está consolidado e quer profissionalizar a gestão',
      description: 'Ideal para quem já domina o básico e quer dar o próximo passo rumo à automação.',
      bookingLimit: '35 reservas por mês',
      features: [
        'Até 35 reservas por mês',
        'Cadastro de clientes',
        'Acesso rápido ao WhatsApp',
        'Dashboard financeiro',
        'Integração com Airbnb (Airbnb → Ordomo)',
        'Templates de comunicação',
        'Calendário avançado',
        'Exportação de dados'
      ],
      popular: false,
      highlight: 'RECOMENDADO PARA VOCÊ'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 179,
      period: 'por mês',
      icon: Zap,
      subtitle: '👉 Para quem vive de hospedagem e não pode perder nenhuma oportunidade',
      description: 'Feito para pousadas e gestores que precisam de controle total, sem limites e com segurança máxima na operação.',
      bookingLimit: 'Reservas ilimitadas',
      features: [
        'Reservas ilimitadas',
        'Cadastro de clientes',
        'Acesso rápido ao WhatsApp',
        'Dashboard financeiro',
        'Exportação de relatórios',
        'Integração com Airbnb (Airbnb → Ordomo)',
        'Link iCal de exportação (Ordomo → Airbnb)',
        'Multi-chalé',
        'Suporte prioritário',
        'API personalizada',
        'Backup automático',
        'Prioridade em novas funcionalidades'
      ],
      popular: true,
      highlight: 'MAIS POPULAR'
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

  const handleSubscribe = async (planId: string) => {
    if (planId === 'basic') {
      toast({
        title: "Plano Atual",
        description: "Você já está no plano básico.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement Stripe checkout
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock checkout
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Stripe customer portal
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock portal
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
    } finally {
      setIsLoading(false);
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
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => setShowPhotoDialog(true)}
                  >
                    <Camera size={14} />
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium">Foto do Perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no ícone para alterar sua foto
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={generalSettings.displayName}
                    onChange={(e) => setGeneralSettings(prev => ({ 
                      ...prev, 
                      displayName: e.target.value 
                    }))}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowEmailDialog(true)}
                      className="shrink-0"
                    >
                      <Edit2 size={14} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no botão para alterar seu email
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={generalSettings.phone}
                  onChange={(e) => setGeneralSettings(prev => ({ 
                    ...prev, 
                    phone: e.target.value 
                  }))}
                  placeholder="+55 (11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                Preferências do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={generalSettings.timezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">América/São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">América/Nova York (GMT-4)</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={generalSettings.language}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alterar Senha</p>
                  <p className="text-sm text-muted-foreground">
                    Mantenha sua conta segura com uma senha forte
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
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessões Ativas</p>
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
                    <h3 className="font-semibold text-sm md:text-base">{subscription.planName}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      R$ {subscription.price}/mês
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                  {subscription.nextBilling && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Próxima cobrança: {subscription.nextBilling}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 md:mt-4">
                <p className="text-xs md:text-sm font-medium mb-2">Recursos inclusos:</p>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                  {subscription.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {subscription.currentPlan !== 'basic' && (
                <div className="mt-3 md:mt-4 flex gap-2">
                  <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading} className="text-xs md:text-sm h-8 md:h-9">
                    Gerenciar Assinatura
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
                  const isCurrent = plan.id === subscription.currentPlan;
                  
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
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <Badge 
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                plan.highlight === 'MAIS POPULAR' 
                                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                              }`}
                            >
                              {plan.highlight}
                            </Badge>
                          </div>
                        )}
                        {plan.popular && !plan.highlight && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                              MAIS POPULAR
                            </Badge>
                          </div>
                        )}
                      
                      {/* Header with icon and plan name */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <Icon size={20} className="text-primary" />
                          </div>
                          <h3 className="font-bold text-xl text-foreground">{plan.name}</h3>
                        </div>
                        
                        {/* Subtitle */}
                        {plan.subtitle && (
                          <p className="text-sm text-primary font-medium mb-3">
                            {plan.subtitle}
                          </p>
                        )}
                        
                        {/* Price section */}
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-3xl font-bold text-foreground">
                            R$ {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm font-medium">
                            /{plan.period}
                          </span>
                        </div>
                        
                        {/* Booking limit highlight */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                          <p className="text-sm font-semibold text-primary">
                            {plan.bookingLimit}
                          </p>
                        </div>
                        
                        {/* Description */}
                        {plan.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {plan.description}
                          </p>
                        )}
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
                          'Integração com Airbnb (Airbnb → Ordomo)',
                          'Link iCal de exportação (Ordomo → Airbnb)',
                          'Multi-chalé',
                          'Suporte prioritário'
                        ].map((feature, index) => {
                          const isIncluded = plan.features.some(f => 
                            f.includes(feature) || 
                            (feature.includes('reservas') && (f.includes('reservas') || f.includes('Reservas')))
                          ) || (index === 1); // Cadastro de clientes sempre incluído
                          
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
                          disabled={isCurrent || isLoading}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          {isCurrent ? 'Plano Atual' : 'Começar'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Billing History (placeholder) */}
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
        currentEmail={user?.email || ''}
      />
      
      <SessionsDialog
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
      />
      
      <ProfilePhotoDialog
        open={showPhotoDialog}
        onOpenChange={setShowPhotoDialog}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdate={setAvatarUrl}
      />
    </div>
  );
};

export default Settings;