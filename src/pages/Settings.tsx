import { useState } from 'react';
import { Save, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

const Settings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: settings?.email_config?.smtpHost || '',
    smtpPort: settings?.email_config?.smtpPort || '',
    smtpUser: settings?.email_config?.smtpUser || '',
    smtpPassword: settings?.email_config?.smtpPassword || '',
    senderEmail: settings?.email_config?.senderEmail || '',
    senderName: settings?.email_config?.senderName || '',
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    apiToken: settings?.whatsapp_config?.apiToken || '',
    phoneNumber: settings?.whatsapp_config?.phoneNumber || '',
    businessId: settings?.whatsapp_config?.businessId || '',
  });

  const handleSaveEmail = async () => {
    try {
      await updateSettings({ email_config: emailConfig });
      toast({
        title: "Configurações de Email Salvas",
        description: "As configurações de email foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de email.",
        variant: "destructive",
      });
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      await updateSettings({ whatsapp_config: whatsappConfig });
      toast({
        title: "Configurações do WhatsApp Salvas",
        description: "As configurações do WhatsApp foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do WhatsApp.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações do App</h1>
        <p className="text-muted-foreground">
          Configure suas integrações de email e WhatsApp para comunicação com clientes.
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail size={16} />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle size={16} />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail size={20} />
                Configuração de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input
                    id="smtpPort"
                    placeholder="587"
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">Usuário SMTP</Label>
                  <Input
                    id="smtpUser"
                    placeholder="seu-email@gmail.com"
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">Senha SMTP</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderEmail">Email do Remetente</Label>
                  <Input
                    id="senderEmail"
                    placeholder="noreply@seudominio.com"
                    value={emailConfig.senderEmail}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="senderName">Nome do Remetente</Label>
                  <Input
                    id="senderName"
                    placeholder="Sua Empresa"
                    value={emailConfig.senderName}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, senderName: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveEmail} disabled={isLoading} className="flex items-center gap-2">
                <Save size={16} />
                Salvar Configurações de Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle size={20} />
                Configuração do WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiToken">Token da API do WhatsApp Business</Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="••••••••"
                  value={whatsappConfig.apiToken}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Número do WhatsApp</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+5511999999999"
                  value={whatsappConfig.phoneNumber}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="businessId">ID da Conta Business</Label>
                <Input
                  id="businessId"
                  placeholder="ID da sua conta business"
                  value={whatsappConfig.businessId}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessId: e.target.value }))}
                />
              </div>

              <Button onClick={handleSaveWhatsApp} disabled={isLoading} className="flex items-center gap-2">
                <Save size={16} />
                Salvar Configurações do WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;