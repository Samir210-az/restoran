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
      staff_role: "owner" | "manager" | "cashier" | "chef" | "waiter"
      subscription_plan: "free" | "pro" | "enterprise"
      subscription_status: "active" | "trial" | "suspended" | "cancelled"
      supported_language: "az" | "en" | "ru"
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
