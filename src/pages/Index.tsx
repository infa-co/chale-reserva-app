import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Calendar, 
  Users, 
  RefreshCw, 
  BarChart3, 
  Smartphone, 
  ArrowRight,
  Check,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "Nunca mais perdi reserva por falta de organização.",
      author: "Gabriela",
      business: "Refúgio Azul"
    },
    {
      text: "Finalmente um app leve e que resolve de verdade.",
      author: "Daniel", 
      business: "Chalé Vista Alta"
    }
  ];

  const benefits = [
    {
      icon: Calendar,
      title: "Calendário por mês",
      description: "Visualize todas as reservas em um calendário intuitivo"
    },
    {
      icon: Users,
      title: "Cadastro completo de hóspedes", 
      description: "Mantenha todas as informações dos clientes organizadas"
    },
    {
      icon: RefreshCw,
      title: "Sincronização com Airbnb",
      description: "Integre automaticamente com sua conta do Airbnb"
    },
    {
      icon: BarChart3,
      title: "Dashboard financeiro",
      description: "Acompanhe receitas e métricas importantes"
    },
    {
      icon: Smartphone,
      title: "100% mobile, rápido e seguro",
      description: "Acesse de qualquer lugar, a qualquer hora"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Crie sua conta",
      description: "Cadastro rápido e simples"
    },
    {
      number: "2", 
      title: "Cadastre seu chalé ou pousada",
      description: "Configure suas propriedades"
    },
    {
      number: "3",
      title: "Controle todas as reservas em um só lugar",
      description: "Gerencie tudo facilmente"
    }
  ];

  const plans = [
    {
      name: "Básico",
      price: "39,90",
      badge: null,
      features: [
        "Até 15 reservas/mês",
        "Cadastro de clientes",
        
      ]
    },
    {
      name: "Pro",
      price: "89,90", 
      badge: "MAIS POPULAR",
      badgeColor: "bg-primary",
      features: [
        "Até 35 reservas/mês",
        "Cadastro de clientes",
        "Acesso rápido ao WhatsApp",
        "Dashboard financeiro",
        "Exportação de relatórios",
        "Integração Airbnb",
        "Multi-chalé",
        "Suporte prioritário"
      ]
    },
    {
      name: "Premium",
      price: "179,90",
      badge: "COMPLETO",
      badgeColor: "bg-accent",
      features: [
        "Reservas ilimitadas",
        "Cadastro de clientes",
        "Acesso rápido ao WhatsApp",
        "Dashboard financeiro",
        "Exportação de relatórios",
        "Integração completa com Airbnb",
        "Multi-chalé",
        "Suporte prioritário"
      ]
    }
  ];

  const faqs = [
    {
      question: "O que acontece se eu passar do limite de reservas?",
      answer: "Você receberá uma notificação e poderá fazer upgrade do plano a qualquer momento."
    },
    {
      question: "É compatível com Airbnb?",
      answer: "Sim! Nos planos Pro e Premium você pode sincronizar automaticamente com o Airbnb."
    },
    {
      question: "Posso cancelar quando quiser?",
      answer: "Claro! Você pode cancelar sua assinatura a qualquer momento sem multas."
    },
    {
      question: "Funciona no celular?",
      answer: "Sim! O Ordomo é 100% responsivo e funciona perfeitamente em celulares e tablets."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full bg-primary/95 backdrop-blur-sm z-50 border-b border-primary/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-montserrat font-bold text-white">
            <img 
              src="/ordomo-logo-small.png" 
              alt="Ordomo Logo"
              className="h-7 w-7 object-contain"
            />
            ORDOMO
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => navigate('/auth')}
            >
              Entrar
            </Button>
            <Button 
              className="bg-white text-primary hover:bg-white/90 font-montserrat font-semibold"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Começar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-montserrat font-bold leading-tight">
                Organize suas reservas. 
                <br />
                <span className="text-secondary">Controle sua hospedagem.</span>
              </h1>
              <p className="text-xl text-white/90 max-w-lg">
                Sistema inteligente e simples para chalés e pousadas.
                <br />
                No celular, no computador, sem confusão.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-montserrat font-semibold text-lg px-8 py-4 h-auto"
                onClick={() => navigate('/auth?mode=signup')}
              >
                <ArrowRight className="mr-2" />
                Começar agora
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src="/ordomo-app-mockup.png" 
                  alt="Mockup do app Ordomo"
                  className="w-64 h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Background mockup */}
        <div className="absolute top-16 right-0 opacity-20 pointer-events-none">
          <img 
            src="/mockup-dashboard.png" 
            alt="Dashboard mockup"
            className="w-48 md:w-64 h-auto object-contain transform rotate-12"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
              Feito para quem vive da hospedagem
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-card hover:shadow-soft transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <benefit.icon size={32} className="text-primary" />
                  </div>
                  <h3 className="font-montserrat font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-muted relative overflow-hidden">
        {/* Background mockup */}
        <div className="absolute bottom-0 left-0 opacity-15 pointer-events-none">
          <img 
            src="/mockup-hospede.png" 
            alt="Hóspede mockup"
            className="w-40 md:w-56 h-auto object-contain transform -rotate-12"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
              Começar é simples
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => (
              <Card key={index} className="border-0 shadow-card">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto font-montserrat font-bold text-2xl">
                    {step.number}
                  </div>
                  <h3 className="font-montserrat font-semibold text-xl">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="font-montserrat font-semibold"
              onClick={() => navigate('/auth?mode=signup')}
            >
              <Smartphone className="mr-2" />
              Começar agora
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 relative overflow-hidden">
        {/* Background mockup with glow effect */}
        <div className="absolute top-10 right-10 opacity-25 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <img 
              src="/mockup-stats.png" 
              alt="Estatísticas mockup"
              className="w-52 md:w-72 h-auto object-contain transform rotate-6 relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
              Planos para todos os donos
            </h2>
            <p className="text-xl text-muted-foreground">
              A partir de R$39,90 por mês
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative border-2 shadow-card hover:shadow-soft transition-all ${plan.badge ? 'border-primary scale-105' : 'border-border'}`}>
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
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Card className="border-0 shadow-card">
                <CardContent className="p-12 text-center">
                  <div className="flex items-center justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={24} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-2xl font-medium text-foreground mb-6">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="text-muted-foreground">
                    <p className="font-semibold">{testimonials[currentTestimonial].author}</p>
                    <p>{testimonials[currentTestimonial].business}</p>
                  </div>
                </CardContent>
              </Card>
              
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentTestimonial(prev => prev === 0 ? testimonials.length - 1 : prev - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentTestimonial(prev => prev === testimonials.length - 1 ? 0 : prev + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
              Dúvidas frequentes
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-montserrat font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-montserrat font-bold mb-8">
            Tudo o que sua hospedagem precisa em um só lugar.
          </h2>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 font-montserrat font-semibold text-lg px-8 py-4 h-auto"
            onClick={() => navigate('/auth?mode=signup')}
          >
            🎯 Criar conta agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="/ordomo-footer-logo.png" 
                alt="Ordomo"
                className="h-16 w-auto object-contain mb-4"
              />
              <p className="text-white/70">Feito por Infa & Co.</p>
            </div>
            <div className="md:text-right">
              <div className="flex flex-col md:items-end gap-4">
                <div className="flex gap-6 text-sm">
                  <button 
                    onClick={() => navigate('/legal/terms')}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Termos de Uso
                  </button>
                  <button 
                    onClick={() => navigate('/legal/privacy')}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Política de Privacidade
                  </button>
                  <button 
                    onClick={() => navigate('/legal/support')}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Suporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
