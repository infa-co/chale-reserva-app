import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    document.title = "404 - Página não encontrada | Ordomo";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-6xl font-montserrat font-bold text-foreground mb-2">404</h1>
            <h2 className="text-2xl font-montserrat font-semibold text-foreground mb-2">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              A página que você está procurando não existe ou foi movida. 
              Verifique o endereço ou volte para a página inicial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-2">Precisa de ajuda?</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/legal/support')}
              className="text-primary"
            >
              Entre em contato com o suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
