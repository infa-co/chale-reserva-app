export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          birth_date: string | null
          booking_date: string
          check_in: string
          check_out: string
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          guest_name: string
          historical_registration_date: string | null
          id: string
          is_historical: boolean
          nights: number
          notes: string | null
          payment_method: string
          phone: string
          property_id: string | null
          state: string | null
          status: string
          total_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          booking_date: string
          check_in: string
          check_out: string
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          guest_name: string
          historical_registration_date?: string | null
          id?: string
          is_historical?: boolean
          nights: number
          notes?: string | null
          payment_method: string
          phone: string
          property_id?: string | null
          state?: string | null
          status: string
          total_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          booking_date?: string
          check_in?: string
          check_out?: string
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          guest_name?: string
          historical_registration_date?: string | null
          id?: string
          is_historical?: boolean
          nights?: number
          notes?: string | null
          payment_method?: string
          phone?: string
          property_id?: string | null
          state?: string | null
          status?: string
          total_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          state: string | null
          tags: string[] | null
          total_bookings: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          state?: string | null
          tags?: string[] | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          state?: string | null
          tags?: string[] | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      external_bookings: {
        Row: {
          created_at: string
          end_date: string
          external_id: string
          ical_sync_id: string
          id: string
          platform_name: string
          raw_ical_data: string | null
          start_date: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          external_id: string
          ical_sync_id: string
          id?: string
          platform_name?: string
          raw_ical_data?: string | null
          start_date: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          external_id?: string
          ical_sync_id?: string
          id?: string
          platform_name?: string
          raw_ical_data?: string | null
          start_date?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_bookings_ical_sync_id_fkey"
            columns: ["ical_sync_id"]
            isOneToOne: false
            referencedRelation: "ical_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      ical_syncs: {
        Row: {
          created_at: string
          ical_url: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          platform_name: string
          property_id: string | null
          sync_frequency_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform_name?: string
          property_id?: string | null
          sync_frequency_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform_name?: string
          property_id?: string | null
          sync_frequency_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ical_syncs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          capacity: number
          created_at: string | null
          default_daily_rate: number | null
          fixed_notes: string | null
          id: string
          is_active: boolean
          location: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capacity: number
          created_at?: string | null
          default_daily_rate?: number | null
          fixed_notes?: string | null
          id?: string
          is_active?: boolean
          location: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          default_daily_rate?: number | null
          fixed_notes?: string | null
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_config: Json | null
          id: string
          updated_at: string
          user_id: string
          whatsapp_config: Json | null
        }
        Insert: {
          created_at?: string
          email_config?: Json | null
          id?: string
          updated_at?: string
          user_id: string
          whatsapp_config?: Json | null
        }
        Update: {
          created_at?: string
          email_config?: Json | null
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp_config?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
