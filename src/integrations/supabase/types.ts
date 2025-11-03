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
      carousel_items: {
        Row: {
          active: boolean | null
          button_link: string | null
          button_text: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          ativo: boolean
          created_at: string
          data_evento: string
          descricao: string | null
          id: string
          imagem_url: string | null
          local: string | null
          numero_vagas: number | null
          preco: number | null
          titulo: string
          updated_at: string
          vagas_limitadas: boolean | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_evento: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          numero_vagas?: number | null
          preco?: number | null
          titulo: string
          updated_at?: string
          vagas_limitadas?: boolean | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_evento?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          numero_vagas?: number | null
          preco?: number | null
          titulo?: string
          updated_at?: string
          vagas_limitadas?: boolean | null
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avaliacao: number | null
          categoria: string
          codigo_barras: string | null
          created_at: string
          data_lancamento: string | null
          descricao: string | null
          destaque: boolean | null
          dimensoes: string | null
          estoque: number
          faixa_etaria: string | null
          fornecedor: string | null
          id: string
          imagem_url: string | null
          lancamento: boolean | null
          marca: string | null
          material: string | null
          nome: string
          origem: string | null
          peso: string | null
          preco: number
          promocao: boolean | null
          status: string
          total_avaliacoes: number | null
          updated_at: string
        }
        Insert: {
          avaliacao?: number | null
          categoria: string
          codigo_barras?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          destaque?: boolean | null
          dimensoes?: string | null
          estoque?: number
          faixa_etaria?: string | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          lancamento?: boolean | null
          marca?: string | null
          material?: string | null
          nome: string
          origem?: string | null
          peso?: string | null
          preco: number
          promocao?: boolean | null
          status?: string
          total_avaliacoes?: number | null
          updated_at?: string
        }
        Update: {
          avaliacao?: number | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          destaque?: boolean | null
          dimensoes?: string | null
          estoque?: number
          faixa_etaria?: string | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          lancamento?: boolean | null
          marca?: string | null
          material?: string | null
          nome?: string
          origem?: string | null
          peso?: string | null
          preco?: number
          promocao?: boolean | null
          status?: string
          total_avaliacoes?: number | null
          updated_at?: string
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
