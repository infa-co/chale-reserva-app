import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestUser {
  email: string;
  password: string;
  plan: 'basic' | 'pro' | 'premium';
  name: string;
  description: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: "usuario.basico@teste.com",
    password: "teste123",
    plan: 'basic',
    name: "Usuário Básico",
    description: "50 reservas/mês, 1 propriedade"
  },
  {
    email: "usuario.pro@teste.com",
    password: "teste123", 
    plan: 'pro',
    name: "Usuário Pro",
    description: "200 reservas/mês, 3 propriedades, WhatsApp, Dashboard"
  },
  {
    email: "usuario.premium@teste.com",
    password: "teste123",
    plan: 'premium', 
    name: "Usuário Premium",
    description: "Ilimitado, todos os recursos"
  }
];

export const TestUserPanel = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const { signIn, signOut, user } = useAuth();

  const createTestUsers = async () => {
    setIsCreating(true);
    
    try {
      for (const testUser of TEST_USERS) {
        // Tentar criar o usuário
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              name: testUser.name
            }
          }
        });

        if (signUpError && !signUpError.message.includes('User already registered')) {
          console.error(`Erro ao criar usuário ${testUser.email}:`, signUpError);
          continue;
        }

        // Simular plano no localStorage para desenvolvimento
        if (authData.user) {
          localStorage.setItem(`test_plan_${authData.user.id}`, testUser.plan);
        }
      }
      
      toast.success('Usuários de teste criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuários de teste:', error);
      toast.error('Erro ao criar usuários de teste');
    } finally {
      setIsCreating(false);
    }
  };

  const loginAsTestUser = async (testUser: TestUser) => {
    setLoggingIn(testUser.email);
    
    try {
      if (user) {
        await signOut();
        // Aguardar um pouco para garantir que o logout foi processado
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const { error } = await signIn(testUser.email, testUser.password);
      
      if (error) {
        toast.error(`Erro ao fazer login: ${error.message}`);
      } else {
        toast.success(`Logado como ${testUser.name}`);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro inesperado no login');
    } finally {
      setLoggingIn(null);
    }
  };

  const getIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return Star;
      case 'pro': return Zap;
      case 'premium': return Crown;
      default: return User;
    }
  };

  const getColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'text-yellow-600';
      case 'pro': return 'text-blue-600'; 
      case 'premium': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-6 w-6" />
          Usuários de Teste - Desenvolvimento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use estas contas para testar diferentes planos e funcionalidades
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <Button 
            onClick={createTestUsers} 
            disabled={isCreating}
            className="mb-4"
          >
            {isCreating ? 'Criando usuários...' : 'Criar Usuários de Teste'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {TEST_USERS.map((testUser) => {
            const Icon = getIcon(testUser.plan);
            
            return (
              <Card key={testUser.email} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${getColor(testUser.plan)}`} />
                      <div>
                        <h4 className="font-semibold">{testUser.name}</h4>
                        <p className="text-sm text-muted-foreground">{testUser.description}</p>
                      </div>
                    </div>
                    
                    <Badge className={getBadgeColor(testUser.plan)}>
                      {testUser.plan.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <p><strong>Email:</strong> {testUser.email}</p>
                    <p><strong>Senha:</strong> {testUser.password}</p>
                  </div>
                  
                  <Button 
                    onClick={() => loginAsTestUser(testUser)}
                    disabled={loggingIn === testUser.email}
                    className="w-full"
                    variant={user?.email === testUser.email ? "secondary" : "default"}
                  >
                    {loggingIn === testUser.email ? 'Entrando...' : 
                     user?.email === testUser.email ? 'Logado' : 'Fazer Login'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {user && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Usuário atual:</strong> {user.email}
            </p>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="mt-2"
            >
              Fazer Logout
            </Button>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          <p>⚠️ Apenas para desenvolvimento - Os planos são simulados localmente</p>
        </div>
      </CardContent>
    </Card>
  );
};