import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageCircle, Clock, HelpCircle, Download, Link as LinkIcon } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

const Support = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Suporte - Ordomo";
    
    // Meta tags for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Central de suporte do Ordomo - Obtenha ajuda, tire dúvidas e acesse recursos de apoio.");
    }

    const metaRobots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    metaRobots.setAttribute("name", "robots");
    metaRobots.setAttribute("content", "noindex, nofollow");
    if (!document.querySelector('meta[name="robots"]')) {
      document.head.appendChild(metaRobots);
    }
  }, []);

  const handleWhatsAppSupport = () => {
    openWhatsApp({
      phone: "5511999999999", // Substitua pelo número real
      message: "Olá! Preciso de ajuda com o Ordomo.",
      asciiFallback: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Central de Suporte</h1>
          <p className="text-muted-foreground">Estamos aqui para ajudar você a aproveitar ao máximo o Ordomo</p>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                E-mail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-2">suporte@ordomo.com.br</p>
              <p className="text-sm text-muted-foreground">
                Resposta em até 24 horas úteis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleWhatsAppSupport} className="mb-2">
                Falar com suporte
              </Button>
              <p className="text-sm text-muted-foreground">
                Atendimento rápido e direto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business Hours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Horário de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-foreground">
              <p><strong>Segunda a Sexta:</strong> 9h às 18h</p>
              <p><strong>Sábado:</strong> 9h às 14h</p>
              <p><strong>Domingo:</strong> Apenas WhatsApp para urgências</p>
              <p className="text-sm text-muted-foreground mt-2">
                * Horário de Brasília (GMT-3)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Como alterar ou cancelar meu plano?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Acesse Configurações → Assinatura em sua conta. Lá você pode alterar seu plano, 
                cancelar ou acessar o portal do cliente para gerenciar pagamentos.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Como exportar minhas reservas?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Na página de Reservas, clique no botão "Exportar" no canto superior direito. 
                Você pode escolher entre diferentes formatos (PDF, Excel) e filtrar por período.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Como conectar minha conta do Airbnb?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Vá em Propriedades → selecione sua propriedade → Sincronização. Siga o assistente 
                para conectar seu calendário do Airbnb via iCal ou configure a sincronização automática.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Como funciona a sincronização de calendários?</h3>
              <p className="text-muted-foreground leading-relaxed">
                O Ordomo sincroniza automaticamente com Airbnb, Booking.com e outras plataformas 
                através de links iCal. As reservas são atualizadas em tempo real para evitar overbooking.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Posso usar o Ordomo offline?</h3>
              <p className="text-muted-foreground leading-relaxed">
                O Ordomo é uma aplicação web que funciona melhor com conexão à internet. 
                Algumas funcionalidades podem funcionar offline temporariamente, mas recomendamos 
                conexão estável para sincronização completa.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Recursos Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Tutorial Completo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Guia passo a passo para usar o Ordomo
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Manual em PDF
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Baixe o manual completo da plataforma
                  </div>
                </div>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Não encontrou o que procurava? Entre em contato conosco através dos canais acima 
                ou navegue pelas outras páginas:
              </p>
              <div className="flex gap-4 mt-3">
                <button 
                  onClick={() => navigate('/legal/terms')}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Termos de Uso
                </button>
                <button 
                  onClick={() => navigate('/legal/privacy')}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Política de Privacidade
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;