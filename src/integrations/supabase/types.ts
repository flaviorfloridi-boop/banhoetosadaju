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
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          horario: string
          id: string
          observacoes: string | null
          pet_id: string
          servico: Database["public"]["Enums"]["servico_tipo"]
          status: Database["public"]["Enums"]["agendamento_status"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data: string
          horario: string
          id?: string
          observacoes?: string | null
          pet_id: string
          servico: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          horario?: string
          id?: string
          observacoes?: string | null
          pet_id?: string
          servico?: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          chave: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      gallery_posts: {
        Row: {
          created_at: string
          enviado_por: string | null
          id: string
          legenda: string | null
          ordem: number
          publicado: boolean
          storage_path: string
        }
        Insert: {
          created_at?: string
          enviado_por?: string | null
          id?: string
          legenda?: string | null
          ordem?: number
          publicado?: boolean
          storage_path: string
        }
        Update: {
          created_at?: string
          enviado_por?: string | null
          id?: string
          legenda?: string | null
          ordem?: number
          publicado?: boolean
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_posts_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string | null
          cliente_id: string
          created_at: string
          descricao: string
          environment: string
          id: string
          metodo: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          valor_cents: number
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id: string
          created_at?: string
          descricao: string
          environment?: string
          id?: string
          metodo?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          valor_cents: number
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string
          created_at?: string
          descricao?: string
          environment?: string
          id?: string
          metodo?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          valor_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_photos: {
        Row: {
          agendamento_id: string | null
          created_at: string
          enviado_por: string | null
          id: string
          legenda: string | null
          pet_id: string
          storage_path: string
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string
          enviado_por?: string | null
          id?: string
          legenda?: string | null
          pet_id: string
          storage_path: string
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string
          enviado_por?: string | null
          id?: string
          legenda?: string | null
          pet_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_photos_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          created_at: string
          especie: string
          id: string
          nome: string
          observacoes: string | null
          porte: string | null
          raca: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          especie?: string
          id?: string
          nome: string
          observacoes?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          especie?: string
          id?: string
          nome?: string
          observacoes?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          ativo: boolean
          categoria: string
          chave: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
          valor_cents: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
          valor_cents?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
          valor_cents?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      taxi_dog: {
        Row: {
          agendamento_id: string | null
          bairro: string
          cliente_id: string
          created_at: string
          data: string
          endereco_coleta: string
          horario: string
          id: string
          observacoes: string | null
          pet_id: string
          ponto_referencia: string | null
          status: Database["public"]["Enums"]["taxi_dog_status"]
          taxa: number
          tipo: Database["public"]["Enums"]["taxi_dog_tipo"]
          updated_at: string
        }
        Insert: {
          agendamento_id?: string | null
          bairro: string
          cliente_id: string
          created_at?: string
          data: string
          endereco_coleta: string
          horario: string
          id?: string
          observacoes?: string | null
          pet_id: string
          ponto_referencia?: string | null
          status?: Database["public"]["Enums"]["taxi_dog_status"]
          taxa?: number
          tipo: Database["public"]["Enums"]["taxi_dog_tipo"]
          updated_at?: string
        }
        Update: {
          agendamento_id?: string | null
          bairro?: string
          cliente_id?: string
          created_at?: string
          data?: string
          endereco_coleta?: string
          horario?: string
          id?: string
          observacoes?: string | null
          pet_id?: string
          ponto_referencia?: string | null
          status?: Database["public"]["Enums"]["taxi_dog_status"]
          taxa?: number
          tipo?: Database["public"]["Enums"]["taxi_dog_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxi_dog_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxi_dog_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxi_dog_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_agendamentos_por_dia: {
        Args: { fim: string; inicio: string }
        Returns: {
          data: string
          limite: number
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      agendamento_status:
        | "solicitado"
        | "confirmado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      servico_tipo:
        | "banho"
        | "tosa"
        | "banho_e_tosa"
        | "hidratacao"
        | "tosa_higienica"
      taxi_dog_status:
        | "solicitado"
        | "confirmado"
        | "a_caminho"
        | "concluido"
        | "cancelado"
      taxi_dog_tipo: "coleta" | "entrega" | "coleta_e_entrega"
      user_role: "cliente" | "funcionario" | "admin"
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
    Enums: {
      agendamento_status: [
        "solicitado",
        "confirmado",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      servico_tipo: [
        "banho",
        "tosa",
        "banho_e_tosa",
        "hidratacao",
        "tosa_higienica",
      ],
      taxi_dog_status: [
        "solicitado",
        "confirmado",
        "a_caminho",
        "concluido",
        "cancelado",
      ],
      taxi_dog_tipo: ["coleta", "entrega", "coleta_e_entrega"],
      user_role: ["cliente", "funcionario", "admin"],
    },
  },
} as const
