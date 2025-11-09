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
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: Database["public"]["Enums"]["account_type"]
          name: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id: Database["public"]["Enums"]["account_type"]
          name: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: Database["public"]["Enums"]["account_type"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          account: Database["public"]["Enums"]["account_type"] | null
          amount: number
          category: string | null
          counterparty: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string
          id: string
          paid_date: string | null
          status: Database["public"]["Enums"]["bill_status"]
          type: Database["public"]["Enums"]["bill_type"]
          updated_at: string
        }
        Insert: {
          account?: Database["public"]["Enums"]["account_type"] | null
          amount: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          created_by: string
          description: string
          due_date: string
          id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          type: Database["public"]["Enums"]["bill_type"]
          updated_at?: string
        }
        Update: {
          account?: Database["public"]["Enums"]["account_type"] | null
          amount?: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          type?: Database["public"]["Enums"]["bill_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_liquidations: {
        Row: {
          card_brand: Database["public"]["Enums"]["card_brand"]
          created_at: string
          id: string
          liquidated: boolean
          liquidation_date: string
          net_amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_amount: number
          sale_date: string
          sale_id: string
          tax_amount: number
          tax_rate: number
        }
        Insert: {
          card_brand: Database["public"]["Enums"]["card_brand"]
          created_at?: string
          id?: string
          liquidated?: boolean
          liquidation_date: string
          net_amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_amount: number
          sale_date: string
          sale_id: string
          tax_amount: number
          tax_rate: number
        }
        Update: {
          card_brand?: Database["public"]["Enums"]["card_brand"]
          created_at?: string
          id?: string
          liquidated?: boolean
          liquidation_date?: string
          net_amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_amount?: number
          sale_date?: string
          sale_id?: string
          tax_amount?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_liquidations_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account: Database["public"]["Enums"]["account_type"]
          amount: number
          category: string
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          account: Database["public"]["Enums"]["account_type"]
          amount: number
          category: string
          created_at?: string
          created_by: string
          date: string
          description: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          account?: Database["public"]["Enums"]["account_type"]
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string
          created_by: string
          date: string
          description: string
          from_account: Database["public"]["Enums"]["account_type"]
          id: string
          reference: string | null
          to_account: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          created_by: string
          date: string
          description: string
          from_account: Database["public"]["Enums"]["account_type"]
          id?: string
          reference?: string | null
          to_account: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          from_account?: Database["public"]["Enums"]["account_type"]
          id?: string
          reference?: string | null
          to_account?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "internal_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pendings: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          type: Database["public"]["Enums"]["pending_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description: string
          id?: string
          type: Database["public"]["Enums"]["pending_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: Database["public"]["Enums"]["pending_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          card_brand: Database["public"]["Enums"]["card_brand"] | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          liquidated: boolean | null
          liquidation_date: string | null
          net_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          amount: number
          card_brand?: Database["public"]["Enums"]["card_brand"] | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          liquidated?: boolean | null
          liquidation_date?: string | null
          net_amount?: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          amount?: number
          card_brand?: Database["public"]["Enums"]["card_brand"] | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          liquidated?: boolean | null
          liquidation_date?: string | null
          net_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type:
        | "caixa_dinheiro"
        | "caixa_pix"
        | "investimento"
        | "quitacao_dividas"
        | "reserva_folha"
      app_role: "admin" | "user"
      bill_status: "pendente" | "pago" | "vencido"
      bill_type: "pagar" | "receber"
      card_brand: "visa_master" | "elo_amex"
      payment_method: "dinheiro" | "pix" | "credito" | "debito"
      pending_type: "allocation_20" | "allocation_10" | "reserve_130"
      transaction_category:
        | "ALOCACAO_20"
        | "ALOCACAO_10"
        | "RESERVA_130"
        | "LIQUIDACAO_CARTAO"
        | "DESPESA"
        | "VENDA"
        | "AJUSTE"
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
      account_type: [
        "caixa_dinheiro",
        "caixa_pix",
        "investimento",
        "quitacao_dividas",
        "reserva_folha",
      ],
      app_role: ["admin", "user"],
      bill_status: ["pendente", "pago", "vencido"],
      bill_type: ["pagar", "receber"],
      card_brand: ["visa_master", "elo_amex"],
      payment_method: ["dinheiro", "pix", "credito", "debito"],
      pending_type: ["allocation_20", "allocation_10", "reserve_130"],
      transaction_category: [
        "ALOCACAO_20",
        "ALOCACAO_10",
        "RESERVA_130",
        "LIQUIDACAO_CARTAO",
        "DESPESA",
        "VENDA",
        "AJUSTE",
      ],
    },
  },
} as const
