import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export const ChangeEmailDialog = ({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite um novo email.",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Email igual",
        description: "O novo email deve ser diferente do atual.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email de confirmação enviado",
        description: `Um email de confirmação foi enviado para ${newEmail}. Verifique sua caixa de entrada e clique no link para confirmar a alteração.`,
      });

      setNewEmail('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Email update error:', error);
      
      let errorMessage = "Ocorreu um erro ao alterar o email. Tente novamente.";
      
      if (error.message?.includes('email already registered')) {
        errorMessage = "Este email já está em uso por outra conta.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
      }
      
      toast({
        title: "Erro ao alterar email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} />
            Alterar Email
          </DialogTitle>
          <DialogDescription>
            Digite seu novo email abaixo. Você receberá um email de confirmação para validar a alteração.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentEmail">Email Atual</Label>
            <Input
              id="currentEmail"
              type="email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="newEmail">Novo Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Digite seu novo email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> Após confirmar, você receberá um email de verificação. 
              Clique no link no email para ativar o novo endereço.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Confirmação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};