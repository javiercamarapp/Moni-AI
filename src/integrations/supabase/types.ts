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
      app_invitations: {
        Row: {
          created_at: string
          current_uses: number | null
          expires_at: string
          id: string
          invite_code: string
          inviter_user_id: string
          max_uses: number | null
        }
        Insert: {
          created_at?: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          invite_code: string
          inviter_user_id: string
          max_uses?: number | null
        }
        Update: {
          created_at?: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          invite_code?: string
          inviter_user_id?: string
          max_uses?: number | null
        }
        Relationships: []
      }
      app_referrals: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          invited_user_id: string
          inviter_user_id: string
          xp_awarded: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          invited_user_id: string
          inviter_user_id: string
          xp_awarded?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          invited_user_id?: string
          inviter_user_id?: string
          xp_awarded?: boolean | null
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
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          requirement_category: string | null
          requirement_type: string
          requirement_value: number | null
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          rarity?: string
          requirement_category?: string | null
          requirement_type: string
          requirement_value?: number | null
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          requirement_category?: string | null
          requirement_type?: string
          requirement_value?: number | null
          xp_reward?: number
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
      circle_challenges: {
        Row: {
          circle_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          xp_reward: number
        }
        Insert: {
          circle_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          xp_reward?: number
        }
        Update: {
          circle_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "circle_challenges_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_goal_members: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_amount: number
          goal_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          goal_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          goal_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_goal_members_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "circle_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_goals: {
        Row: {
          ai_confidence: number | null
          category: string | null
          circle_id: string
          completed_members: number
          created_at: string
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          predicted_completion_date: string | null
          required_weekly_saving: number | null
          start_date: string | null
          target_amount: number
          title: string
        }
        Insert: {
          ai_confidence?: number | null
          category?: string | null
          circle_id: string
          completed_members?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          predicted_completion_date?: string | null
          required_weekly_saving?: number | null
          start_date?: string | null
          target_amount?: number
          title: string
        }
        Update: {
          ai_confidence?: number | null
          category?: string | null
          circle_id?: string
          completed_members?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          predicted_completion_date?: string | null
          required_weekly_saving?: number | null
          start_date?: string | null
          target_amount?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_goals_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_invitations: {
        Row: {
          circle_id: string
          code: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
        }
        Insert: {
          circle_id: string
          code: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Update: {
          circle_id?: string
          code?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_invitations_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          user_id: string
          xp: number | null
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          user_id: string
          xp?: number | null
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_news: {
        Row: {
          circle_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          published_at: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_news_favorites: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_news_favorites_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "circle_news"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competition_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      daily_challenges: {
        Row: {
          category: string | null
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          estimated_savings: number | null
          id: string
          is_personalized: boolean | null
          period: string
          target_amount: number | null
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string | null
          challenge_type: string
          created_at?: string
          description: string
          difficulty?: string
          estimated_savings?: number | null
          id?: string
          is_personalized?: boolean | null
          period?: string
          target_amount?: number | null
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string | null
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_savings?: number | null
          id?: string
          is_personalized?: boolean | null
          period?: string
          target_amount?: number | null
          title?: string
          xp_reward?: number
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
      friend_activity: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      friend_activity_reactions: {
        Row: {
          activity_id: string | null
          created_at: string | null
          emoji: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          emoji: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          emoji?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_activity_reactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "friend_activity"
            referencedColumns: ["id"]
          },
        ]
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
      goal_activities: {
        Row: {
          activity_type: string
          amount: number | null
          created_at: string | null
          goal_id: string
          id: string
          message: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          amount?: number | null
          created_at?: string | null
          goal_id: string
          id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          amount?: number | null
          created_at?: string | null
          goal_id?: string
          id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_activities_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_adjustments: {
        Row: {
          adjustment_type: string | null
          created_at: string | null
          goal_id: string
          id: string
          new_predicted_date: string | null
          new_weekly_amount: number | null
          old_predicted_date: string | null
          old_weekly_amount: number | null
          reason: string | null
          user_id: string
        }
        Insert: {
          adjustment_type?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          new_predicted_date?: string | null
          new_weekly_amount?: number | null
          old_predicted_date?: string | null
          old_weekly_amount?: number | null
          reason?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          new_predicted_date?: string | null
          new_weekly_amount?: number | null
          old_predicted_date?: string | null
          old_weekly_amount?: number | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_adjustments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "goal_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_comments: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          comment: string
          created_at: string | null
          deleted_at: string | null
          goal_id: string
          id: string
          is_pinned: boolean | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          comment: string
          created_at?: string | null
          deleted_at?: string | null
          goal_id: string
          id?: string
          is_pinned?: boolean | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          comment?: string
          created_at?: string | null
          deleted_at?: string | null
          goal_id?: string
          id?: string
          is_pinned?: boolean | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_comments_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "goal_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_group_adjustments: {
        Row: {
          adjustment_type: string | null
          created_at: string | null
          goal_id: string
          id: string
          members_affected: number | null
          new_predicted_date: string | null
          new_weekly_amount: number | null
          old_predicted_date: string | null
          old_weekly_amount: number | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          adjustment_type?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          members_affected?: number | null
          new_predicted_date?: string | null
          new_weekly_amount?: number | null
          old_predicted_date?: string | null
          old_weekly_amount?: number | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          adjustment_type?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          members_affected?: number | null
          new_predicted_date?: string | null
          new_weekly_amount?: number | null
          old_predicted_date?: string | null
          old_weekly_amount?: number | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_group_adjustments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "circle_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_insights_cache: {
        Row: {
          created_at: string
          expires_at: string
          goal_id: string
          id: string
          insights: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          goal_id: string
          id?: string
          insights: Json
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          goal_id?: string
          id?: string
          insights?: Json
          user_id?: string
        }
        Relationships: []
      }
      goal_invitations: {
        Row: {
          created_at: string | null
          from_user_id: string
          goal_id: string
          id: string
          responded_at: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          goal_id: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          goal_id?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_invitations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          ai_confidence: number | null
          category: string | null
          color: string
          created_at: string
          current: number
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          last_contribution_date: string | null
          members: number | null
          predicted_completion_date: string | null
          required_daily_saving: number | null
          required_weekly_saving: number | null
          start_date: string | null
          target: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          category?: string | null
          color?: string
          created_at?: string
          current?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          last_contribution_date?: string | null
          members?: number | null
          predicted_completion_date?: string | null
          required_daily_saving?: number | null
          required_weekly_saving?: number | null
          start_date?: string | null
          target: number
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          category?: string | null
          color?: string
          created_at?: string
          current?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          last_contribution_date?: string | null
          members?: number | null
          predicted_completion_date?: string | null
          required_daily_saving?: number | null
          required_weekly_saving?: number | null
          start_date?: string | null
          target?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
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
      monthly_challenges: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          month: number
          points: number
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          month: number
          points?: number
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          month?: number
          points?: number
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      monthly_rankings: {
        Row: {
          challenges_completed: number
          created_at: string
          id: string
          month: number
          total_points: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          challenges_completed?: number
          created_at?: string
          id?: string
          month: number
          total_points?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          challenges_completed?: number
          created_at?: string
          id?: string
          month?: number
          total_points?: number
          updated_at?: string
          user_id?: string
          year?: number
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
          score_moni: number | null
          total_xp: number | null
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
          score_moni?: number | null
          total_xp?: number | null
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
          score_moni?: number | null
          total_xp?: number | null
          updated_at?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      progress_feedback: {
        Row: {
          badges_unlocked: number
          challenges_completed: number
          created_at: string
          feedback_message: string
          feedback_type: string
          id: string
          period_end: string
          period_start: string
          total_saved: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          badges_unlocked?: number
          challenges_completed?: number
          created_at?: string
          feedback_message: string
          feedback_type: string
          id?: string
          period_end: string
          period_start: string
          total_saved?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          badges_unlocked?: number
          challenges_completed?: number
          created_at?: string
          feedback_message?: string
          feedback_type?: string
          id?: string
          period_end?: string
          period_start?: string
          total_saved?: number
          user_id?: string
          xp_earned?: number
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
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      user_achievements: {
        Row: {
          achievement_id: number
          achievement_name: string
          id: string
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: number
          achievement_name: string
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: number
          achievement_name?: string
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_badges: {
        Row: {
          badge_description: string | null
          badge_name: string
          created_at: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "monthly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenges: {
        Row: {
          accepted_at: string | null
          actual_savings: number | null
          ai_verification_result: Json | null
          challenge_date: string
          challenge_id: string
          completed: boolean
          created_at: string
          difficulty_level: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
          verification_attempts: number | null
          verified_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_savings?: number | null
          ai_verification_result?: Json | null
          challenge_date?: string
          challenge_id: string
          completed?: boolean
          created_at?: string
          difficulty_level?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          verification_attempts?: number | null
          verified_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_savings?: number | null
          ai_verification_result?: Json | null
          challenge_date?: string
          challenge_id?: string
          completed?: boolean
          created_at?: string
          difficulty_level?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_attempts?: number | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string
          current_level: number
          id: string
          level_title: string | null
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          id?: string
          level_title?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          id?: string
          level_title?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
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
      add_user_xp: {
        Args: { p_user_id: string; xp_to_add: number }
        Returns: undefined
      }
      apply_default_categories_to_existing_users: {
        Args: never
        Returns: undefined
      }
      calculate_goal_prediction: {
        Args: {
          p_current_savings: number
          p_deadline: string
          p_goal_id: string
          p_target_amount: number
        }
        Returns: Json
      }
      create_default_expense_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_default_income_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_social_xp: {
        Args: { target_user_id: string; xp_amount?: number }
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
      process_app_referral: {
        Args: { p_invite_code: string; p_invited_user_id: string }
        Returns: undefined
      }
      update_circle_goal: {
        Args: { p_amount: number; p_circle_id: string }
        Returns: undefined
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
