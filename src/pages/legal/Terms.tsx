import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Termos de Uso - Ordomo";
    
    // Meta tags for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Termos de uso da plataforma Ordomo para gestão de reservas de chalés e pousadas.");
    }

    const metaRobots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    metaRobots.setAttribute("name", "robots");
    metaRobots.setAttribute("content", "noindex, nofollow");
    if (!document.querySelector('meta[name="robots"]')) {
      document.head.appendChild(metaRobots);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introdução</h2>
            <p className="text-foreground leading-relaxed">
              Bem-vindo ao Ordomo! Estes Termos de Uso regem o uso da nossa plataforma de gestão de reservas 
              para chalés, pousadas e propriedades de hospedagem. Ao acessar ou usar nossos serviços, você 
              concorda em cumprir estes termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Uso da Plataforma Ordomo</h2>
            <p className="text-foreground leading-relaxed">
              O Ordomo é uma plataforma SaaS (Software as a Service) que oferece ferramentas para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Gestão de reservas e calendários</li>
              <li>Controle de propriedades e hóspedes</li>
              <li>Sincronização com plataformas externas (Airbnb, Booking.com)</li>
              <li>Relatórios e análises de desempenho</li>
              <li>Comunicação automatizada com hóspedes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Obrigações do Usuário</h2>
            <p className="text-foreground leading-relaxed">
              Ao usar o Ordomo, você se compromete a:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Usar a plataforma apenas para fins legais e legítimos</li>
              <li>Respeitar os direitos de outros usuários e terceiros</li>
              <li>Não tentar comprometer a segurança da plataforma</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Propriedade Intelectual</h2>
            <p className="text-foreground leading-relaxed">
              Todos os direitos de propriedade intelectual da plataforma Ordomo, incluindo software, 
              design, textos, imagens e marcas registradas, pertencem ao Ordomo ou seus licenciadores. 
              É proibida a reprodução, distribuição ou modificação sem autorização expressa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Cancelamentos e Reembolsos</h2>
            <p className="text-foreground leading-relaxed">
              As assinaturas do Ordomo podem ser canceladas a qualquer momento através da área de 
              configurações da conta. O cancelamento entrará em vigor no final do período de cobrança atual. 
              Não oferecemos reembolsos para períodos já utilizados, exceto em casos específicos 
              previstos na legislação brasileira.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Isenção de Responsabilidade</h2>
            <p className="text-foreground leading-relaxed">
              O Ordomo é fornecido "como está" e não garantimos que o serviço será ininterrupto ou 
              livre de erros. Não nos responsabilizamos por perdas ou danos decorrentes do uso da 
              plataforma, incluindo, mas não limitado a, perda de dados, lucros cessantes ou 
              interrupção de negócios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Alterações nos Termos</h2>
            <p className="text-foreground leading-relaxed">
              Reservamos o direito de modificar estes Termos de Uso a qualquer momento. As alterações 
              serão comunicadas através da plataforma ou por e-mail. O uso continuado dos serviços 
              após as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Contato</h2>
            <p className="text-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através da nossa{' '}
              <button 
                onClick={() => navigate('/legal/support')}
                className="text-primary hover:text-primary/80 underline"
              >
                página de suporte
              </button>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;