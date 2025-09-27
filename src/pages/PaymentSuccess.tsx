import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();
  const { getCurrentTier } = useSubscription();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      await checkSubscription();
      
      // Send welcome email after subscription is confirmed
      const currentTier = getCurrentTier();
      if (currentTier) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              planName: currentTier.name,
              planPrice: `R$ ${currentTier.price}`
            }
          });
          
          toast.success("Email de boas-vindas enviado!");
        } catch (error) {
          console.error("Erro ao enviar email de boas-vindas:", error);
          // Don't show error to user, it's not critical
        }
      }
    };

    handlePaymentSuccess();
  }, [checkSubscription, getCurrentTier]);

  return (
    <div className="min-h-screen bg-background font-inter flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-soft border-0">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-montserrat font-bold text-foreground">
                Pagamento realizado com sucesso!
              </h1>
              <p className="text-xl text-muted-foreground">
                Sua assinatura foi ativada e você já pode começar a usar o Ordomo.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-4">
              <h3 className="font-montserrat font-semibold text-lg">O que acontece agora?</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Você receberá um email de confirmação com os detalhes da sua assinatura</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Já pode começar a cadastrar suas propriedades e reservas</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Acesso completo a todas as funcionalidades do seu plano</span>
                </li>
              </ul>
            </div>

            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="font-montserrat font-semibold text-lg px-8 py-4 h-auto"
            >
              <ArrowRight className="mr-2" />
              Começar a usar o Ordomo
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>Precisa de ajuda? Entre em contato com nosso suporte.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;