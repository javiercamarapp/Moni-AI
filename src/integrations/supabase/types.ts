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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activos: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string | null
          es_activo_fijo: boolean | null
          fecha_adquisicion: string | null
          id: string
          liquidez_porcentaje: number | null
          moneda: string | null
          nombre: string
          subcategoria: string | null
          tasa_rendimiento: number | null
          updated_at: string | null
          user_id: string
          valor: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          es_activo_fijo?: boolean | null
          fecha_adquisicion?: string | null
          id?: string
          liquidez_porcentaje?: number | null
          moneda?: string | null
          nombre: string
          subcategoria?: string | null
          tasa_rendimiento?: number | null
          updated_at?: string | null
          user_id: string
          valor?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          es_activo_fijo?: boolean | null
          fecha_adquisicion?: string | null
          id?: string
          liquidez_porcentaje?: number | null
          moneda?: string | null
          nombre?: string
          subcategoria?: string | null
          tasa_rendimiento?: number | null
          updated_at?: string | null
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          access_token: string
          account_id: string
          bank_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          plaid_item_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          bank_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          plaid_item_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          plaid_item_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          monthly_budget: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          monthly_budget?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          monthly_budget?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_aspirations: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses_config: {
        Row: {
          category_name: string
          created_at: string
          id: string
          monthly_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          monthly_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          monthly_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string
          created_at: string
          current: number
          deadline: string | null
          id: string
          members: number | null
          target: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          current?: number
          deadline?: string | null
          id?: string
          members?: number | null
          target: number
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          current?: number
          deadline?: string | null
          id?: string
          members?: number | null
          target?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          created_at: string
          id: string
          net_worth: number
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          net_worth?: number
          snapshot_date: string
          total_assets?: number
          total_liabilities?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          net_worth?: number
          snapshot_date?: string
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          daily_spending_limit: number | null
          daily_summary: boolean | null
          goal_reminders: boolean | null
          id: string
          preferred_notification_time: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          savings_tips: boolean | null
          spending_alerts: boolean | null
          transaction_alert_threshold: number | null
          updated_at: string | null
          user_id: string
          weekly_analysis: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_spending_limit?: number | null
          daily_summary?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          preferred_notification_time?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          savings_tips?: boolean | null
          spending_alerts?: boolean | null
          transaction_alert_threshold?: number | null
          updated_at?: string | null
          user_id: string
          weekly_analysis?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_spending_limit?: number | null
          daily_summary?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          preferred_notification_time?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          savings_tips?: boolean | null
          spending_alerts?: boolean | null
          transaction_alert_threshold?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_analysis?: boolean | null
        }
        Relationships: []
      }
      pasivos: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string | null
          es_corto_plazo: boolean | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          id: string
          moneda: string | null
          nombre: string
          subcategoria: string | null
          tasa_interes: number | null
          updated_at: string | null
          user_id: string
          valor: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          es_corto_plazo?: boolean | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          moneda?: string | null
          nombre: string
          subcategoria?: string | null
          tasa_interes?: number | null
          updated_at?: string | null
          user_id: string
          valor?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          es_corto_plazo?: boolean | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          moneda?: string | null
          nombre?: string
          subcategoria?: string | null
          tasa_interes?: number | null
          updated_at?: string | null
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          budget_quiz_completed: boolean | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          level: number | null
          level_quiz_completed: boolean | null
          updated_at: string
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          budget_quiz_completed?: boolean | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          level?: number | null
          level_quiz_completed?: boolean | null
          updated_at?: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          budget_quiz_completed?: boolean | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          level?: number | null
          level_quiz_completed?: boolean | null
          updated_at?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          status: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          category_id: string | null
          created_at: string
          description: string
          frequency: string | null
          id: string
          payment_method: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          frequency?: string | null
          id?: string
          payment_method?: string | null
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          frequency?: string | null
          id?: string
          payment_method?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_aspirations: {
        Row: {
          created_at: string
          id: string
          question_id: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: number
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      user_scores: {
        Row: {
          components: Json | null
          last_calculated_at: string | null
          score_moni: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          components?: Json | null
          last_calculated_at?: string | null
          score_moni?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          components?: Json | null
          last_calculated_at?: string | null
          score_moni?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          ai_interpretation: Json | null
          created_at: string | null
          id: string
          message_text: string
          phone_number: string
          processed: boolean | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          ai_interpretation?: Json | null
          created_at?: string | null
          id?: string
          message_text: string
          phone_number: string
          processed?: boolean | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          ai_interpretation?: Json | null
          created_at?: string | null
          id?: string
          message_text?: string
          phone_number?: string
          processed?: boolean | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      resumen_patrimonio: {
        Row: {
          patrimonio_neto: number | null
          total_activos: number | null
          total_pasivos: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_default_categories_to_existing_users: {
        Args: never
        Returns: undefined
      }
      create_default_expense_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_default_income_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      insert_bank_connection_secure: {
        Args: {
          p_account_id: string
          p_bank_name: string
          p_encrypted_token: string
          p_plaid_item_id?: string
          p_user_id: string
        }
        Returns: string
      }
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
