import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Política de Privacidade - Ordomo";
    
    // Meta tags for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Política de privacidade do Ordomo - Como coletamos, usamos e protegemos seus dados pessoais.");
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introdução</h2>
            <p className="text-foreground leading-relaxed">
              O Ordomo está comprometido em proteger sua privacidade e dados pessoais. Esta política 
              explica como coletamos, usamos, compartilhamos e protegemos suas informações, em 
              conformidade com a Lei Geral de Proteção de Dados (LGPD) e outras legislações aplicáveis.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Dados Coletados</h2>
            <p className="text-foreground leading-relaxed">
              Coletamos as seguintes categorias de dados pessoais:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li><strong>Dados de cadastro:</strong> Nome completo, e-mail, telefone</li>
              <li><strong>Dados de propriedades:</strong> Informações sobre chalés e acomodações</li>
              <li><strong>Dados de reservas:</strong> Informações de hóspedes e estadias</li>
              <li><strong>Dados de pagamento:</strong> Informações processadas através do Stripe</li>
              <li><strong>Dados de uso:</strong> Logs de acesso, preferências e interações na plataforma</li>
              <li><strong>Dados técnicos:</strong> Endereço IP, tipo de dispositivo, navegador</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Finalidade do Uso</h2>
            <p className="text-foreground leading-relaxed">
              Utilizamos seus dados pessoais para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Fornecimento e operação da plataforma Ordomo</li>
              <li>Gestão de contas e autenticação de usuários</li>
              <li>Processamento de pagamentos e faturamento</li>
              <li>Comunicação sobre o serviço e suporte técnico</li>
              <li>Melhoria da plataforma e desenvolvimento de novos recursos</li>
              <li>Cumprimento de obrigações legais e regulamentares</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Compartilhamento com Terceiros</h2>
            <p className="text-foreground leading-relaxed">
              Compartilhamos dados pessoais apenas quando necessário com:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li><strong>Stripe:</strong> Para processamento seguro de pagamentos</li>
              <li><strong>Supabase:</strong> Para infraestrutura de banco de dados e autenticação</li>
              <li><strong>Provedores de serviços:</strong> Para hospedagem e análises técnicas</li>
              <li><strong>Autoridades legais:</strong> Quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="text-foreground leading-relaxed">
              Todos os terceiros são obrigados a manter a confidencialidade e segurança dos dados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Segurança dos Dados</h2>
            <p className="text-foreground leading-relaxed">
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e planos de recuperação</li>
              <li>Auditoria periódica de segurança</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Seus Direitos</h2>
            <p className="text-foreground leading-relaxed">
              De acordo com a LGPD, você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a exclusão de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados</li>
              <li>Revogar o consentimento quando aplicável</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Cookies e Tecnologias</h2>
            <p className="text-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Manter sessões de usuário ativas</li>
              <li>Lembrar preferências e configurações</li>
              <li>Analisar o uso da plataforma</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>
            <p className="text-foreground leading-relaxed">
              Você pode controlar o uso de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Contato para Dúvidas</h2>
            <p className="text-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato 
              através da nossa{' '}
              <button 
                onClick={() => navigate('/legal/support')}
                className="text-primary hover:text-primary/80 underline"
              >
                página de suporte
              </button>{' '}
              ou pelo e-mail: privacy@ordomo.com.br
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;