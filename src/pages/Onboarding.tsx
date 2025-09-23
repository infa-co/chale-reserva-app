import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();

  useEffect(() => {
    // Verificar status da assinatura quando chegar ao onboarding
    checkSubscription();
  }, [checkSubscription]);

  const features = [
    {
      icon: Calendar,
      title: "Gerencie suas reservas",
      description: "Organize todas as suas reservas em um só lugar"
    },
    {
      icon: Users,
      title: "Controle de hóspedes",
      description: "Mantenha histórico completo dos seus clientes"
    },
    {
      icon: BarChart3,
      title: "Relatórios detalhados",
      description: "Acompanhe o desempenho do seu negócio"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-sage-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-sage-800">
            Bem-vindo ao Ordomo! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Sua assinatura foi ativada com sucesso. Agora você pode começar a gerenciar suas reservas de forma profissional.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-sage-200">
                <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sage-800">{feature.title}</h3>
                  <p className="text-sm text-sage-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-amber-800">Verificação de e-mail</h4>
                <p className="text-sm text-amber-700">
                  Se ainda não verificou seu e-mail, verifique sua caixa de entrada e spam.
                  A verificação permite acesso completo a todas as funcionalidades.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
              size="lg"
            >
              Acessar Painel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/meus-chales')}
              className="w-full"
            >
              Configurar Propriedades
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;