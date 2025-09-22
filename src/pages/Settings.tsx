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
import SubscriptionSection from '@/components/SubscriptionSection';

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
          <SubscriptionSection />


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