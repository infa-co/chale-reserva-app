import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface ErrorProps {
  error?: Error;
  resetError?: () => void;
}

const Error = ({ error, resetError }: ErrorProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.error("Application Error:", error);
    document.title = "Erro | Ordomo";
  }, [error]);

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-montserrat font-bold text-foreground mb-2">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e estamos 
              trabalhando para resolver o problema.
            </p>
            
            {error && (
              <details className="text-left bg-muted/50 p-4 rounded-lg mb-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                  Detalhes técnicos
                </summary>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {error.message}
                </p>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
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
            <p className="text-sm text-muted-foreground mb-2">
              O problema persiste?
            </p>
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

export default Error;
