import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Redefinir senha | OR DOMO";

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(!!session);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Erro ao redefinir senha: " + error.message);
        return;
      }
      toast.success("Senha redefinida com sucesso! Faça login novamente.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-600">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-semibold text-sage-800 mb-2">Link inválido ou expirado</h1>
            <p className="text-muted-foreground mb-6">Solicite um novo email de recuperação.</p>
            <Button onClick={() => navigate("/auth")} className="w-full bg-sage-600 hover:bg-sage-700 text-white">
              Voltar ao login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 p-4">
      <main className="w-full max-w-md" role="main">
        <article className="bg-white rounded-2xl shadow-xl p-8">
          <header className="text-center mb-8">
            <img
              src="/lovable-uploads/4c0333c9-dada-46c7-8544-352d42f7c0d2.png"
              alt="OR DOMO logo"
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-sage-800">Redefinir senha</h1>
            <p className="text-muted-foreground">Crie uma nova senha para sua conta</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">Nova senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder="Digite a nova senha"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500 hover:text-sage-700"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder="Repita a nova senha"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500 hover:text-sage-700"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-sage-600 hover:bg-sage-700 text-white py-3 text-lg font-medium">
              {loading ? "Redefinindo..." : "Salvar nova senha"}
            </Button>

            <Button type="button" variant="outline" onClick={() => navigate("/auth")} className="w-full">
              Cancelar
            </Button>
          </form>
        </article>
      </main>
    </div>
  );
};

export default ResetPassword;
