
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Check if should show signup form based on URL parameters
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      if (!email) {
        toast.error('Por favor, informe seu email');
        return;
      }

      setLoading(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          console.error('Reset password error:', error);
          toast.error('Erro ao enviar email de recuperação: ' + error.message);
        } else {
          toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
          setResetEmailSent(true);
        }
      } catch (error) {
        console.error('Reset password error:', error);
        toast.error('Erro inesperado. Tente novamente.');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!isLogin && !name) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error('Erro ao fazer login: ' + error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          console.error('Signup error:', error);
          if (error.message.includes('User already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error('Erro ao criar conta: ' + error.message);
          }
        } else {
          toast.success('Conta criada com sucesso! Agora escolha seu plano.');
          navigate('/payment');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/4c0333c9-dada-46c7-8544-352d42f7c0d2.png" 
              alt="OR DOMO" 
              className="h-16 mx-auto mb-4"
            />
            <p className="text-muted-foreground">
              {isForgotPassword 
                ? (resetEmailSent ? 'Email enviado!' : 'Recuperar senha')
                : (isLogin ? 'Entre na sua conta' : 'Crie sua conta')
              }
            </p>
          </div>

          {resetEmailSent ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 mb-2">
                  Email de recuperação enviado para:
                </p>
                <p className="font-medium text-green-900">{email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <Button
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Voltar ao login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && !isForgotPassword && (
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      placeholder="Sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500 hover:text-sage-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-600 hover:bg-sage-700 text-white py-3 text-lg font-medium"
              >
                {loading 
                  ? 'Carregando...' 
                  : (isForgotPassword 
                      ? 'Enviar email de recuperação' 
                      : (isLogin ? 'Entrar' : 'Criar Conta')
                    )
                }
              </Button>
            </form>
          )}

          {!resetEmailSent && (
            <div className="mt-6 text-center space-y-3">
              {!isForgotPassword ? (
                <>
                  {isLogin && (
                    <button
                      onClick={() => setIsForgotPassword(true)}
                      className="block w-full text-sage-600 hover:text-sage-800 text-sm font-medium"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sage-600 hover:text-sage-800 text-sm font-medium"
                  >
                    {isLogin 
                      ? 'Não tem uma conta? Cadastre-se' 
                      : 'Já tem uma conta? Entre'
                    }
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setEmail('');
                  }}
                  className="text-sage-600 hover:text-sage-800 text-sm font-medium"
                >
                  Voltar ao login
                </button>
              )}
            </div>
          )}
        </div>

        {/* Usuários de Teste */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 text-center">🧪 Usuários de Teste</h3>
          <div className="space-y-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-900">Plano Básico</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">15 reservas/mês</span>
              </div>
              <div className="text-blue-700">
                <p><strong>Email:</strong> usuario.basico@teste.com</p>
                <p><strong>Senha:</strong> teste123</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-900">Plano Pro</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">35 reservas/mês</span>
              </div>
              <div className="text-blue-700">
                <p><strong>Email:</strong> usuario.pro@teste.com</p>
                <p><strong>Senha:</strong> teste123</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-900">Plano Premium</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Ilimitado</span>
              </div>
              <div className="text-blue-700">
                <p><strong>Email:</strong> usuario.premium@teste.com</p>
                <p><strong>Senha:</strong> teste123</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              onClick={() => navigate('/test-users')}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Criar/Gerenciar Usuários de Teste
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-xs text-blue-600 font-medium text-center">Login Rápido:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={async () => {
                  try {
                    const { error } = await signIn('usuario.basico@teste.com', 'teste123');
                    if (error) {
                      toast.error('Erro no login básico: ' + error.message);
                    } else {
                      toast.success('Logado como usuário básico!');
                      navigate('/dashboard');
                    }
                  } catch (e) {
                    toast.error('Erro inesperado');
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs h-8"
                disabled={loading}
              >
                Login Básico
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const { error } = await signIn('usuario.pro@teste.com', 'teste123');
                    if (error) {
                      toast.error('Erro no login pro: ' + error.message);
                    } else {
                      toast.success('Logado como usuário pro!');
                      navigate('/dashboard');
                    }
                  } catch (e) {
                    toast.error('Erro inesperado');
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs h-8"
                disabled={loading}
              >
                Login Pro
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const { error } = await signIn('usuario.premium@teste.com', 'teste123');
                    if (error) {
                      toast.error('Erro no login premium: ' + error.message);
                    } else {
                      toast.success('Logado como usuário premium!');
                      navigate('/dashboard');
                    }
                  } catch (e) {
                    toast.error('Erro inesperado');
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs h-8"
                disabled={loading}
              >
                Login Premium
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
