import { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  onAvatarUpdate: (url: string | null) => void;
}

export const ProfilePhotoDialog = ({ open, onOpenChange, currentAvatarUrl, onAvatarUpdate }: ProfilePhotoDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Delete old avatar if exists
      if (currentAvatarUrl) {
        await deleteCurrentAvatar();
      }

      // Upload new avatar
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          name: user.user_metadata?.name || '',
          email: user.email || ''
        });

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCurrentAvatar = async () => {
    if (!currentAvatarUrl || !user) return;

    try {
      // Extract file path from URL
      const url = new URL(currentAvatarUrl);
      const path = url.pathname.split('/storage/v1/object/public/avatars/')[1];
      
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !currentAvatarUrl) return;

    setIsDeleting(true);
    try {
      await deleteCurrentAvatar();

      // Update user profile to remove avatar_url
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      onAvatarUpdate(null);
      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida com sucesso.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Erro ao remover a foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDisplayUrl = () => {
    return previewUrl || currentAvatarUrl;
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={20} />
              Foto do Perfil
            </DialogTitle>
            <DialogDescription>
              Adicione ou altere sua foto de perfil. Formatos aceitos: JPG, PNG (máx. 5MB).
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={getDisplayUrl() || undefined} />
              <AvatarFallback className="text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
              >
                <Upload size={16} className="mr-2" />
                {selectedFile ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
              </Button>
              
              {currentAvatarUrl && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteAvatar}
                  disabled={isUploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  Remover
                </Button>
              )}
            </div>

            {selectedFile && (
              <p className="text-sm text-muted-foreground text-center">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                onOpenChange(false);
              }}
              disabled={isUploading || isDeleting}
            >
              Cancelar
            </Button>
            
            {selectedFile && (
              <Button 
                onClick={handleUpload}
                disabled={isUploading || isDeleting}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Foto
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};