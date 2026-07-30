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
      ai_conversations: {
        Row: {
          channel: Database["public"]["Enums"]["ai_conversation_channel"]
          created_at: string
          customer_id: string | null
          id: string
          messages: Json
          restaurant_id: string
          status: Database["public"]["Enums"]["ai_conversation_status"]
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["ai_conversation_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          messages?: Json
          restaurant_id: string
          status?: Database["public"]["Enums"]["ai_conversation_status"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["ai_conversation_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          messages?: Json
          restaurant_id?: string
          status?: Database["public"]["Enums"]["ai_conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          payload: Json
          restaurant_id: string
          type: Database["public"]["Enums"]["ai_recommendation_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          restaurant_id: string
          type: Database["public"]["Enums"]["ai_recommendation_type"]
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          restaurant_id?: string
          type?: Database["public"]["Enums"]["ai_recommendation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          restaurant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      customers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          loyalty_points: number
          phone: string | null
          restaurant_id: string
          total_spent: number
          visit_count: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          loyalty_points?: number
          phone?: string | null
          restaurant_id: string
          total_spent?: number
          visit_count?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          loyalty_points?: number
          phone?: string | null
          restaurant_id?: string
          total_spent?: number
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          low_stock_threshold: number
          name: string
          restaurant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          low_stock_threshold?: number
          name: string
          restaurant_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          low_stock_threshold?: number
          name?: string
          restaurant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          quantity: number
          related_order_id: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["inventory_txn_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          quantity: number
          related_order_id?: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["inventory_txn_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          quantity?: number
          related_order_id?: string | null
          restaurant_id?: string
          type?: Database["public"]["Enums"]["inventory_txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          currency: string
          id: string
          issued_at: string
          paid_at: string | null
          provider_invoice_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          issued_at?: string
          paid_at?: string | null
          provider_invoice_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          issued_at?: string
          paid_at?: string | null
          provider_invoice_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          points_change: number
          reason: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          points_change: number
          reason: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          points_change?: number
          reason?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_restaurant_id_fkey"
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
      menu_item_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          menu_item_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          menu_item_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          menu_item_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_embeddings_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: true
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_embeddings_restaurant_id_fkey"
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          restaurant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          restaurant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          restaurant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
      orders: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider: string | null
          provider_ref: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider?: string | null
          provider_ref?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          provider?: string | null
          provider_ref?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_restaurant_id_fkey"
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
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          restaurant_id: string
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          restaurant_id: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          restaurant_id?: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      restaurants: {
        Row: {
          created_at: string
          default_language: Database["public"]["Enums"]["supported_language"]
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          theme_color: string
          timezone: string
        }
        Insert: {
          created_at?: string
          default_language?: Database["public"]["Enums"]["supported_language"]
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          theme_color?: string
          timezone?: string
        }
        Update: {
          created_at?: string
          default_language?: Database["public"]["Enums"]["supported_language"]
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          theme_color?: string
          timezone?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          rating: number
          restaurant_id: string
          sentiment: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          rating: number
          restaurant_id: string
          sentiment?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          restaurant_id?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string | null
          provider_subscription_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: Json
          created_at: string
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          contact_info?: Json
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          contact_info?: Json
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_restaurant_id_fkey"
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
      accept_pending_invitations: { Args: never; Returns: undefined }
      can_manage_menu: {
        Args: { target_restaurant_id: string }
        Returns: boolean
      }
      can_view_business_insights: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      get_business_snapshot: {
        Args: { _days?: number; _restaurant_id: string }
        Returns: Json
      }
      get_order_tracking: {
        Args: { _order_id: string }
        Returns: {
          created_at: string
          id: string
          items: Json
          order_type: Database["public"]["Enums"]["order_type"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          total: number
        }[]
      }
      get_platform_overview: {
        Args: never
        Returns: {
          created_at: string
          id: string
          menu_item_count: number
          name: string
          order_count: number
          owner_email: string
          slug: string
          staff_count: number
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
        }[]
      }
      get_public_restaurant_by_slug: {
        Args: { _slug: string }
        Returns: {
          default_language: Database["public"]["Enums"]["supported_language"]
          id: string
          logo_url: string
          name: string
          slug: string
          theme_color: string
        }[]
      }
      get_public_restaurant_directory: {
        Args: never
        Returns: {
          id: string
          logo_url: string
          name: string
          slug: string
          theme_color: string
        }[]
      }
      get_staff_list: {
        Args: { _restaurant_id: string }
        Returns: {
          email: string
          full_name: string
          hired_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }[]
      }
      get_todays_bestseller: {
        Args: { _restaurant_id: string }
        Returns: {
          menu_item_id: string
          name: Json
          total_quantity: number
        }[]
      }
      invite_staff_member: {
        Args: {
          _email: string
          _restaurant_id: string
          _role: Database["public"]["Enums"]["staff_role"]
        }
        Returns: {
          status: string
        }[]
      }
      is_platform_admin: { Args: never; Returns: boolean }
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
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          theme_color: string
          timezone: string
        }
        SetofOptions: {
          from: "*"
          to: "restaurants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      place_order: {
        Args: {
          _created_by?: string
          _customer_name?: string
          _customer_phone?: string
          _items: Json
          _order_type: Database["public"]["Enums"]["order_type"]
          _payment_method?: Database["public"]["Enums"]["payment_method"]
          _placed_by?: Database["public"]["Enums"]["order_placed_by"]
          _restaurant_id: string
          _table_id: string
        }
        Returns: {
          order_id: string
          total: number
        }[]
      }
      record_inventory_transaction: {
        Args: {
          _item_id: string
          _quantity: number
          _related_order_id?: string
          _type: Database["public"]["Enums"]["inventory_txn_type"]
        }
        Returns: undefined
      }
      request_reservation: {
        Args: {
          _customer_name: string
          _customer_phone: string
          _notes?: string
          _party_size: number
          _reserved_at: string
          _restaurant_id: string
        }
        Returns: {
          reservation_id: string
        }[]
      }
      save_ai_conversation: {
        Args: {
          _conversation_id: string
          _messages: Json
          _restaurant_id: string
        }
        Returns: undefined
      }
      set_restaurant_subscription_status: {
        Args: {
          _restaurant_id: string
          _status: Database["public"]["Enums"]["subscription_status"]
        }
        Returns: undefined
      }
      submit_review: {
        Args: { _comment?: string; _order_id: string; _rating: number }
        Returns: undefined
      }
    }
    Enums: {
      ai_conversation_channel: "qr_menu" | "whatsapp" | "web_chat"
      ai_conversation_status: "active" | "handed_off" | "completed"
      ai_recommendation_type:
        | "upsell"
        | "menu_optimization"
        | "inventory_forecast"
        | "demand_forecast"
      inventory_txn_type: "purchase" | "usage" | "waste" | "adjustment"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      kitchen_item_status: "queued" | "cooking" | "ready"
      order_placed_by: "customer" | "waiter" | "ai_waiter"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "card" | "cash" | "online"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      purchase_order_status:
        | "draft"
        | "sent"
        | "confirmed"
        | "received"
        | "cancelled"
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "cancelled"
        | "no_show"
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
      ai_conversation_channel: ["qr_menu", "whatsapp", "web_chat"],
      ai_conversation_status: ["active", "handed_off", "completed"],
      ai_recommendation_type: [
        "upsell",
        "menu_optimization",
        "inventory_forecast",
        "demand_forecast",
      ],
      inventory_txn_type: ["purchase", "usage", "waste", "adjustment"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      kitchen_item_status: ["queued", "cooking", "ready"],
      order_placed_by: ["customer", "waiter", "ai_waiter"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      order_type: ["dine_in", "takeaway", "delivery"],
      payment_method: ["card", "cash", "online"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      purchase_order_status: [
        "draft",
        "sent",
        "confirmed",
        "received",
        "cancelled",
      ],
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "cancelled",
        "no_show",
      ],
      staff_role: ["owner", "manager", "cashier", "chef", "waiter"],
      subscription_plan: ["free", "pro", "enterprise"],
      subscription_status: ["active", "trial", "suspended", "cancelled"],
      supported_language: ["az", "en", "ru"],
      table_status: ["free", "occupied", "reserved"],
    },
  },
} as const
