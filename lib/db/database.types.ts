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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alternatives: {
        Row: {
          alternative_comment: string | null
          created_at: string
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
          text: string
        }
        Insert: {
          alternative_comment?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
          text: string
        }
        Update: {
          alternative_comment?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "alternatives_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_attempts: {
        Row: {
          anonymous_session_id: string | null
          answered_at: string
          board_id: string | null
          career_id: string | null
          id: string
          is_correct: boolean
          question_id: string
          selected_alternative_id: string
          user_id: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          answered_at?: string
          board_id?: string | null
          career_id?: string | null
          id?: string
          is_correct: boolean
          question_id: string
          selected_alternative_id: string
          user_id?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          answered_at?: string
          board_id?: string | null
          career_id?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_alternative_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_attempts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_attempts_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_attempts_selected_alternative_id_fkey"
            columns: ["selected_alternative_id"]
            isOneToOne: false
            referencedRelation: "alternatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      author_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          instagram: string | null
          is_public: boolean
          photo_url: string | null
          short_bio: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          instagram?: string | null
          is_public?: boolean
          photo_url?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          instagram?: string | null
          is_public?: boolean
          photo_url?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          created_by_author_id: string | null
          created_by_kind: string
          id: string
          is_priority: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          is_priority?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          is_priority?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_created_by_author_id_fkey"
            columns: ["created_by_author_id"]
            isOneToOne: false
            referencedRelation: "author_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          created_at: string
          id: string
          is_launch_career: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_launch_career?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_launch_career?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id?: string
        }
        Relationships: []
      }
      product_events: {
        Row: {
          anonymous_session_id: string | null
          career_id: string | null
          created_at: string
          event_name: string
          id: string
          metadata: Json
          question_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          career_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          question_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          career_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_events_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_tags: {
        Row: {
          question_id: string
          tag_id: string
        }
        Insert: {
          question_id: string
          tag_id: string
        }
        Update: {
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_tags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          annulled: boolean
          answer_key_changed: boolean
          author_id: string | null
          board_id: string | null
          career_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null
          general_comment: string | null
          id: string
          published_at: string | null
          source_cargo: string | null
          source_orgao: string | null
          source_reference: string | null
          source_type: Database["public"]["Enums"]["question_source_type"]
          source_year: number | null
          statement: string
          status: Database["public"]["Enums"]["question_status"]
          subject_id: string | null
          updated_at: string
          image_path: string | null
        }
        Insert: {
          annulled?: boolean
          answer_key_changed?: boolean
          author_id?: string | null
          board_id?: string | null
          career_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          general_comment?: string | null
          id?: string
          published_at?: string | null
          source_cargo?: string | null
          source_orgao?: string | null
          source_reference?: string | null
          source_type?: Database["public"]["Enums"]["question_source_type"]
          source_year?: number | null
          statement: string
          status?: Database["public"]["Enums"]["question_status"]
          subject_id?: string | null
          updated_at?: string
          image_path?: string | null
        }
        Update: {
          annulled?: boolean
          answer_key_changed?: boolean
          author_id?: string | null
          board_id?: string | null
          career_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          general_comment?: string | null
          id?: string
          published_at?: string | null
          source_cargo?: string | null
          source_orgao?: string | null
          source_reference?: string | null
          source_type?: Database["public"]["Enums"]["question_source_type"]
          source_year?: number | null
          statement?: string
          status?: Database["public"]["Enums"]["question_status"]
          subject_id?: string | null
          updated_at?: string
          image_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "author_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          career_id: string
          created_at: string
          created_by_author_id: string | null
          created_by_kind: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          career_id: string
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          career_id?: string
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_created_by_author_id_fkey"
            columns: ["created_by_author_id"]
            isOneToOne: false
            referencedRelation: "author_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          created_by_author_id: string | null
          created_by_kind: string
          id: string
          name: string
          slug: string
          subject_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          name: string
          slug: string
          subject_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_author_id?: string | null
          created_by_kind?: string
          id?: string
          name?: string
          slug?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_author_id_fkey"
            columns: ["created_by_author_id"]
            isOneToOne: false
            referencedRelation: "author_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          force_password_change: boolean
          id: string
          name: string | null
          registration_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          force_password_change?: boolean
          id: string
          name?: string | null
          registration_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          force_password_change?: boolean
          id?: string
          name?: string | null
          registration_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_author_id: { Args: never; Returns: string }
      delete_author_cascade: {
        Args: { p_author_id: string; p_delete_questions?: boolean }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_subscriber: { Args: never; Returns: boolean }
      next_feed_question: {
        Args: { p_board_id?: string; p_career_id: string; p_exclude?: string[] }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      question_difficulty: "facil" | "media" | "dificil"
      question_source_type: "autoral" | "prova_oficial"
      question_status: "draft" | "published" | "unpublished" | "archived"
      subscription_plan: "monthly" | "annual"
      subscription_status:
        | "pending"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      user_role: "student" | "author" | "admin" | "gestor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      question_difficulty: ["facil", "media", "dificil"],
      question_source_type: ["autoral", "prova_oficial"],
      question_status: ["draft", "published", "unpublished", "archived"],
      subscription_plan: ["monthly", "annual"],
      subscription_status: [
        "pending",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      user_role: ["student", "author", "admin", "gestor"],
    },
  },
} as const
