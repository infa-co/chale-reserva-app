import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Payment = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: "39",
      badge: null,
      priceId: "price_1SAARvKF8m13UKNcrykeEAiS",
      features: [
        "✅ Até 15 reservas/mês",
        "✅ Cadastro de clientes",
        "❌ Acesso rápido ao WhatsApp",
        "❌ Dashboard financeiro",
        "❌ Exportação de relatórios",
        "❌ Integração Airbnb (nenhuma)",
        "❌ Link iCal de exportação (Ordomo → Airbnb)",
        "❌ Multi-chalé",
        "❌ Suporte prioritário"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: "89", 
      badge: "MAIS POPULAR",
      badgeColor: "bg-primary",
      priceId: "price_1SAASCKF8m13UKNczP0MpAcg",
      features: [
        "✅ Até 35 reservas/mês",
        "✅ Cadastro de clientes",
        "✅ Acesso rápido ao WhatsApp",
        "✅ Dashboard financeiro",
        "❌ Exportação de relatórios",
        "❌ Integração Airbnb (Airbnb → Ordomo)",
        "✅ Link iCal de exportação (Ordomo → Airbnb)",
        "❌ Multi-chalé",
        "❌ Suporte prioritário"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: "179",
      badge: "COMPLETO",
      badgeColor: "bg-accent",
      priceId: "price_1SAASRKF8m13UKNcPDNS1Pjp",
      features: [
        "✅ Reservas ilimitadas",
        "✅ Cadastro de clientes",
        "✅ Acesso rápido ao WhatsApp",
        "✅ Dashboard financeiro",
        "✅ Exportação de relatórios",
        "✅ Integração completa com Airbnb (Airbnb ↔ Ordomo bidirecional)",
        "✅ Link iCal de exportação (Ordomo → Airbnb)",
        "✅ Multi-chalé",
        "✅ Suporte prioritário"
      ]
    }
  ];

  const handlePlanSelection = async (plan: typeof plans[0]) => {
    if (!session) {
      toast.error("Você precisa estar logado para escolher um plano");
      return;
    }

    setLoading(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Erro ao criar sessão de pagamento');
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background font-inter py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="absolute top-8 left-8 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
          
          <div className="text-2xl font-montserrat font-bold text-primary mb-4">
            ORDOMO
          </div>
          <h1 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano ideal para sua hospedagem e comece a organizar suas reservas hoje mesmo.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative border-2 shadow-card hover:shadow-soft transition-all ${
                plan.badge ? 'border-primary scale-105' : 'border-border'
              }`}
            >
              {plan.badge && (
                <Badge className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${plan.badgeColor} text-white font-montserrat font-semibold px-4 py-1`}>
                  {plan.badge}
                </Badge>
              )}
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <h3 className="font-montserrat font-bold text-2xl mb-2">{plan.name}</h3>
                  <div className="text-4xl font-montserrat font-bold text-primary">
                    R$ {plan.price}
                    <span className="text-base text-muted-foreground font-normal">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full font-montserrat font-semibold"
                  variant={plan.badge ? "default" : "outline"}
                  onClick={() => handlePlanSelection(plan)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Escolher Plano"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Quer testar antes? Você pode escolher um plano depois.
          </p>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="font-montserrat font-semibold"
          >
            Pular esta etapa por enquanto
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Pagamento 100% seguro
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Cancele quando quiser
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Suporte especializado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;