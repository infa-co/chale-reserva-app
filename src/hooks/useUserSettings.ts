import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];

interface EmailConfig {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  senderEmail?: string;
  senderName?: string;
}

interface WhatsAppConfig {
  apiToken?: string;
  phoneNumber?: string;
  businessId?: string;
}

interface UserSettings {
  id: string;
  user_id: string;
  email_config: EmailConfig;
  whatsapp_config: WhatsAppConfig;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          ...data,
          email_config: (data.email_config as EmailConfig) || {},
          whatsapp_config: (data.whatsapp_config as WhatsAppConfig) || {},
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Pick<UserSettings, 'email_config' | 'whatsapp_config'>>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('user_settings')
          .update(updates as any)
          .eq('user_id', user.id)
          .select('*')
          .single();

        if (error) throw error;
        setSettings({
          ...data,
          email_config: (data.email_config as EmailConfig) || {},
          whatsapp_config: (data.whatsapp_config as WhatsAppConfig) || {},
        });
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...updates as any,
          })
          .select('*')
          .single();

        if (error) throw error;
        setSettings({
          ...data,
          email_config: (data.email_config as EmailConfig) || {},
          whatsapp_config: (data.whatsapp_config as WhatsAppConfig) || {},
        });
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    updateSettings,
    isLoading,
    refetch: fetchSettings,
  };
};