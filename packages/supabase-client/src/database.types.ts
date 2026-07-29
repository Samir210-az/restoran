/**
 * AVTOMATIK GENERASIYA OLUNUB - `supabase gen types typescript` ile.
 * Bu faylı əl ilə redaktə ETMƏYİN - dəyişikliklər növbəti generasiyada itəcək.
 * Bazada dəyişiklik lazımdırsa, yeni migrasiya yazın, sonra bu faylı yeniləyin.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          restaurant_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          restaurant_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: Json
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: Json
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: Json
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifiers: {
        Row: {
          created_at: string
          group_name: string
          id: string
          menu_item_id: string
          name: Json
          price_modifier: number
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_name?: string
          id?: string
          menu_item_id: string
          name?: Json
          price_modifier?: number
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          menu_item_id?: string
          name?: Json
          price_modifier?: number
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifiers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifiers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_variants: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          name: Json
          price_modifier: number
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          name?: Json
          price_modifier?: number
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          name?: Json
          price_modifier?: number
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_variants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[]
          calories: number | null
          category_id: string
          created_at: string
          description: Json
          id: string
          image_url: string | null
          is_available: boolean
          name: Json
          prep_time_minutes: number | null
          price: number
          restaurant_id: string
          sort_order: number
          tags: string[]
        }
        Insert: {
          allergens?: string[]
          calories?: number | null
          category_id: string
          created_at?: string
          description?: Json
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: Json
          prep_time_minutes?: number | null
          price: number
          restaurant_id: string
          sort_order?: number
          tags?: string[]
        }
        Update: {
          allergens?: string[]
          calories?: number | null
          category_id?: string
          created_at?: string
          description?: Json
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: Json
          prep_time_minutes?: number | null
          price?: number
          restaurant_id?: string
          sort_order?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: Database["public"]["Enums"]["supported_language"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["supported_language"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["supported_language"]
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          created_at: string
          default_language: Database["public"]["Enums"]["supported_language"]
          id: string
          name: string
          owner_id: string
          slug: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
        }
        Insert: {
          created_at?: string
          default_language?: Database["public"]["Enums"]["supported_language"]
          id?: string
          name: string
          owner_id: string
          slug: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
        }
        Update: {
          created_at?: string
          default_language?: Database["public"]["Enums"]["supported_language"]
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          branch_id: string | null
          created_at: string
          hired_at: string
          id: string
          is_active: boolean
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          hired_at?: string
          id?: string
          is_active?: boolean
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          hired_at?: string
          id?: string
          is_active?: boolean
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          branch_id: string
          capacity: number
          created_at: string
          id: string
          qr_code_url: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Insert: {
          branch_id: string
          capacity?: number
          created_at?: string
          id?: string
          qr_code_url?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Update: {
          branch_id?: string
          capacity?: number
          created_at?: string
          id?: string
          qr_code_url?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          created_at: string
          customer_id: string | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"]
          placed_by: Database["public"]["Enums"]["order_placed_by"]
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          placed_by?: Database["public"]["Enums"]["order_placed_by"]
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          placed_by?: Database["public"]["Enums"]["order_placed_by"]
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          kitchen_status: Database["public"]["Enums"]["kitchen_item_status"]
          menu_item_id: string
          order_id: string
          quantity: number
          restaurant_id: string
          selected_modifiers: Json
          special_instructions: string | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_item_status"]
          menu_item_id: string
          order_id: string
          quantity?: number
          restaurant_id: string
          selected_modifiers?: Json
          special_instructions?: string | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_item_status"]
          menu_item_id?: string
          order_id?: string
          quantity?: number
          restaurant_id?: string
          selected_modifiers?: Json
          special_instructions?: string | null
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          branch_id: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          party_size: number
          reserved_at: string
          restaurant_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          party_size: number
          reserved_at: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          party_size?: number
          reserved_at?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_menu: {
        Args: { target_restaurant_id: string }
        Returns: boolean
      }
      get_public_restaurant_by_slug: {
        Args: { _slug: string }
        Returns: {
          default_language: Database["public"]["Enums"]["supported_language"]
          id: string
          name: string
          slug: string
        }[]
      }
      is_staff_of: { Args: { _restaurant_id: string }; Returns: boolean }
      place_order: {
        Args: {
          _restaurant_id: string
          _table_id: string | null
          _order_type: Database["public"]["Enums"]["order_type"]
          _items: Json
        }
        Returns: { order_id: string; total: number }[]
      }
      request_reservation: {
        Args: {
          _restaurant_id: string
          _customer_name: string
          _customer_phone: string
          _party_size: number
          _reserved_at: string
          _notes?: string | null
        }
        Returns: { reservation_id: string }[]
      }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
      get_platform_overview: {
        Args: Record<string, never>
        Returns: {
          id: string
          name: string
          slug: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          owner_email: string
          created_at: string
          staff_count: number
          menu_item_count: number
          order_count: number
        }[]
      }
      set_restaurant_subscription_status: {
        Args: {
          _restaurant_id: string
          _status: Database["public"]["Enums"]["subscription_status"]
        }
        Returns: undefined
      }
      onboard_restaurant: {
        Args: {
          _default_language?: string
          _name: string
          _slug: string
          _timezone?: string
        }
        Returns: {
          created_at: string
          default_language: Database["public"]["Enums"]["supported_language"]
          id: string
          name: string
          owner_id: string
          slug: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
        }
      }
    }
    Enums: {
      kitchen_item_status: "queued" | "cooking" | "ready"
      order_placed_by: "customer" | "waiter" | "ai_waiter"
      order_status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      reservation_status: "pending" | "confirmed" | "seated" | "cancelled" | "no_show"
      staff_role: "owner" | "manager" | "cashier" | "chef" | "waiter"
      subscription_plan: "free" | "pro" | "enterprise"
      subscription_status: "active" | "trial" | "suspended" | "cancelled"
      supported_language: "az" | "en" | "ru"
      table_status: "free" | "occupied" | "reserved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
