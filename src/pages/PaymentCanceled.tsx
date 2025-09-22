import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-inter flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-soft border-0">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={48} className="text-red-600" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-montserrat font-bold text-foreground">
                Pagamento cancelado
              </h1>
              <p className="text-xl text-muted-foreground">
                Não se preocupe, nenhuma cobrança foi realizada.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-4">
              <h3 className="font-montserrat font-semibold text-lg">O que você pode fazer?</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Voltar e escolher outro plano que melhor atenda suas necessidades</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Testar o Ordomo gratuitamente por tempo limitado</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Entrar em contato para esclarecer dúvidas sobre os planos</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => navigate('/payment')}
                className="font-montserrat font-semibold"
              >
                <ArrowLeft className="mr-2" />
                Voltar aos planos
              </Button>
              
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="font-montserrat font-semibold"
              >
                <ArrowRight className="mr-2" />
                Continuar com teste grátis
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Tem dúvidas sobre os planos? Entre em contato com nosso suporte.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCanceled;