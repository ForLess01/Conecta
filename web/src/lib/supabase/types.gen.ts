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
      account_preferences: {
        Row: {
          approximate_location_only: boolean
          notify_negotiation: boolean
          notify_order: boolean
          notify_risk: boolean
          notify_system: boolean
          notify_transport: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approximate_location_only?: boolean
          notify_negotiation?: boolean
          notify_order?: boolean
          notify_risk?: boolean
          notify_system?: boolean
          notify_transport?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approximate_location_only?: boolean
          notify_negotiation?: boolean
          notify_order?: boolean
          notify_risk?: boolean
          notify_system?: boolean
          notify_transport?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      actor_locations: {
        Row: {
          actor_id: string
          created_at: string
          is_primary: boolean
          is_public: boolean
          label: string
          location_point_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          is_primary?: boolean
          is_public?: boolean
          label: string
          location_point_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          is_primary?: boolean
          is_public?: boolean
          label?: string
          location_point_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_locations_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_locations_location_point_id_fkey"
            columns: ["location_point_id"]
            isOneToOne: false
            referencedRelation: "location_points"
            referencedColumns: ["id"]
          },
        ]
      }
      actor_onboarding_details: {
        Row: {
          actor_id: string
          completed_at: string
          details: Json
          role_code: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          completed_at?: string
          details?: Json
          role_code: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          completed_at?: string
          details?: Json
          role_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_onboarding_details_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      actor_roles: {
        Row: {
          actor_id: string
          created_at: string
          role_id: number
        }
        Insert: {
          actor_id: string
          created_at?: string
          role_id: number
        }
        Update: {
          actor_id?: string
          created_at?: string
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "actor_roles_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      actors: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["actor_kind"]
          organization_id: string | null
          updated_at: string
          user_id: string | null
          verification_status_id: number | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["actor_kind"]
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status_id?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["actor_kind"]
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actors_verification_status_id_fkey"
            columns: ["verification_status_id"]
            isOneToOne: false
            referencedRelation: "verification_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      administrative_area_types: {
        Row: {
          code: string
          id: number
          level: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          level: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          level?: number
          name?: string
        }
        Relationships: []
      }
      administrative_areas: {
        Row: {
          area_type_id: number
          created_at: string
          id: string
          name: string
          official_code: string | null
          parent_id: string | null
        }
        Insert: {
          area_type_id: number
          created_at?: string
          id?: string
          name: string
          official_code?: string | null
          parent_id?: string | null
        }
        Update: {
          area_type_id?: number
          created_at?: string
          id?: string
          name?: string
          official_code?: string | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_areas_area_type_id_fkey"
            columns: ["area_type_id"]
            isOneToOne: false
            referencedRelation: "administrative_area_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "administrative_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_candidate_citations: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          source_url: string
          title: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          source_url: string
          title: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          source_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_candidate_citations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "analysis_risk_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_risk_candidates: {
        Row: {
          analysis_run_id: string
          created_at: string
          district: string | null
          ends_at: string | null
          event_type_code: string
          external_key: string
          id: string
          province: string | null
          region: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_event_id: string | null
          risk_score: number
          road_name: string | null
          severity: number
          source_confidence: number
          starts_at: string | null
          status: Database["public"]["Enums"]["risk_event_status"]
          summary: string
          title: string
        }
        Insert: {
          analysis_run_id: string
          created_at?: string
          district?: string | null
          ends_at?: string | null
          event_type_code: string
          external_key: string
          id?: string
          province?: string | null
          region: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_event_id?: string | null
          risk_score: number
          road_name?: string | null
          severity: number
          source_confidence: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["risk_event_status"]
          summary: string
          title: string
        }
        Update: {
          analysis_run_id?: string
          created_at?: string
          district?: string | null
          ends_at?: string | null
          event_type_code?: string
          external_key?: string
          id?: string
          province?: string | null
          region?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_event_id?: string | null
          risk_score?: number
          road_name?: string | null
          severity?: number
          source_confidence?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["risk_event_status"]
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_risk_candidates_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_risk_candidates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_risk_candidates_risk_event_id_fkey"
            columns: ["risk_event_id"]
            isOneToOne: false
            referencedRelation: "risk_events"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_run_price_suggestions: {
        Row: {
          analysis_run_id: string
          price_suggestion_id: string
        }
        Insert: {
          analysis_run_id: string
          price_suggestion_id: string
        }
        Update: {
          analysis_run_id?: string
          price_suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_run_price_suggestions_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_run_price_suggestions_price_suggestion_id_fkey"
            columns: ["price_suggestion_id"]
            isOneToOne: false
            referencedRelation: "listing_price_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_run_risk_events: {
        Row: {
          analysis_run_id: string
          risk_event_id: string
        }
        Insert: {
          analysis_run_id: string
          risk_event_id: string
        }
        Update: {
          analysis_run_id?: string
          risk_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_run_risk_events_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_run_risk_events_risk_event_id_fkey"
            columns: ["risk_event_id"]
            isOneToOne: false
            referencedRelation: "risk_events"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          analysis_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          input_hash: string | null
          model_name: string | null
          provider: Database["public"]["Enums"]["analysis_provider"]
          started_at: string | null
          status: Database["public"]["Enums"]["analysis_status"]
        }
        Insert: {
          analysis_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          model_name?: string | null
          provider: Database["public"]["Enums"]["analysis_provider"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
        }
        Update: {
          analysis_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          model_name?: string | null
          provider?: Database["public"]["Enums"]["analysis_provider"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles: {
        Row: {
          code: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: number
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: number
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_orders: {
        Row: {
          agreed_delivery_date: string | null
          buyer_actor_id: string
          created_at: string
          currency_id: number
          delivery_location_point_id: string | null
          id: string
          reservation_expires_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          agreed_delivery_date?: string | null
          buyer_actor_id: string
          created_at?: string
          currency_id: number
          delivery_location_point_id?: string | null
          id?: string
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          agreed_delivery_date?: string | null
          buyer_actor_id?: string
          created_at?: string
          currency_id?: number
          delivery_location_point_id?: string | null
          id?: string
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_orders_buyer_actor_id_fkey"
            columns: ["buyer_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_orders_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_orders_delivery_location_point_id_fkey"
            columns: ["delivery_location_point_id"]
            isOneToOne: false
            referencedRelation: "location_points"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proposals: {
        Row: {
          created_at: string
          created_by_actor_id: string
          currency_id: number
          delivery_date: string | null
          expires_at: string | null
          id: string
          logistics_mode: Database["public"]["Enums"]["logistics_mode"] | null
          negotiation_id: string
          quantity: number
          status: Database["public"]["Enums"]["proposal_status"]
          supersedes_proposal_id: string | null
          unit_id: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by_actor_id: string
          currency_id: number
          delivery_date?: string | null
          expires_at?: string | null
          id?: string
          logistics_mode?: Database["public"]["Enums"]["logistics_mode"] | null
          negotiation_id: string
          quantity: number
          status?: Database["public"]["Enums"]["proposal_status"]
          supersedes_proposal_id?: string | null
          unit_id: number
          unit_price: number
        }
        Update: {
          created_at?: string
          created_by_actor_id?: string
          currency_id?: number
          delivery_date?: string | null
          expires_at?: string | null
          id?: string
          logistics_mode?: Database["public"]["Enums"]["logistics_mode"] | null
          negotiation_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["proposal_status"]
          supersedes_proposal_id?: string | null
          unit_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposals_created_by_actor_id_fkey"
            columns: ["created_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_supersedes_proposal_id_fkey"
            columns: ["supersedes_proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          id: number
          name: string
          symbol: string
        }
        Insert: {
          code: string
          id?: number
          name: string
          symbol: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      freight_bids: {
        Row: {
          conditions: string | null
          created_at: string
          currency_id: number
          departure_at: string | null
          estimated_duration_minutes: number | null
          fare_amount: number
          helper_included: boolean
          id: string
          insurance_included: boolean
          shipment_request_id: string
          status: Database["public"]["Enums"]["bid_status"]
          transporter_actor_id: string
          vehicle_id: string
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          currency_id: number
          departure_at?: string | null
          estimated_duration_minutes?: number | null
          fare_amount: number
          helper_included?: boolean
          id?: string
          insurance_included?: boolean
          shipment_request_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          transporter_actor_id: string
          vehicle_id: string
        }
        Update: {
          conditions?: string | null
          created_at?: string
          currency_id?: number
          departure_at?: string | null
          estimated_duration_minutes?: number | null
          fare_amount?: number
          helper_included?: boolean
          id?: string
          insurance_included?: boolean
          shipment_request_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          transporter_actor_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freight_bids_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_bids_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_bids_transporter_actor_id_fkey"
            columns: ["transporter_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_bids_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_price_suggestions: {
        Row: {
          calculated_at: string
          confidence: number
          currency_id: number
          explanation: string | null
          fare_high: number
          fare_low: number
          fare_mid: number
          id: string
          method_version: string
          shipment_request_id: string
        }
        Insert: {
          calculated_at?: string
          confidence: number
          currency_id: number
          explanation?: string | null
          fare_high: number
          fare_low: number
          fare_mid: number
          id?: string
          method_version: string
          shipment_request_id: string
        }
        Update: {
          calculated_at?: string
          confidence?: number
          currency_id?: number
          explanation?: string | null
          fare_high?: number
          fare_low?: number
          fare_mid?: number
          id?: string
          method_version?: string
          shipment_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freight_price_suggestions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_price_suggestions_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          allocation_id: string
          created_at: string
          expires_at: string
          id: string
          offer_listing_id: string
          quantity: number
          status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          allocation_id: string
          created_at?: string
          expires_at: string
          id?: string
          offer_listing_id: string
          quantity: number
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          allocation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          offer_listing_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "order_supplier_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_offer_listing_id_fkey"
            columns: ["offer_listing_id"]
            isOneToOne: false
            referencedRelation: "product_offers"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listing_attribute_values: {
        Row: {
          attribute_definition_id: string
          listing_id: string
          option_id: string | null
          value_boolean: boolean | null
          value_date: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          attribute_definition_id: string
          listing_id: string
          option_id?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          attribute_definition_id?: string
          listing_id?: string
          option_id?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_attribute_values_attribute_definition_id_fkey"
            columns: ["attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_attribute_values_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_attribute_values_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_attribute_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_options"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          created_at: string
          display_order: number
          id: string
          listing_id: string
          mime_type: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          listing_id: string
          mime_type: string
          storage_path: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          listing_id?: string
          mime_type?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_price_suggestions: {
        Row: {
          calculated_at: string
          confidence: number
          currency_id: number
          explanation: string | null
          id: string
          listing_id: string
          method_version: string
          price_high: number
          price_low: number
          price_mid: number
          unit_id: number
        }
        Insert: {
          calculated_at?: string
          confidence: number
          currency_id: number
          explanation?: string | null
          id?: string
          listing_id: string
          method_version: string
          price_high: number
          price_low: number
          price_mid: number
          unit_id: number
        }
        Update: {
          calculated_at?: string
          confidence?: number
          currency_id?: number
          explanation?: string | null
          id?: string
          listing_id?: string
          method_version?: string
          price_high?: number
          price_low?: number
          price_mid?: number
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_price_suggestions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_price_suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_price_suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_price_suggestions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      location_points: {
        Row: {
          access_notes: string | null
          address_reference: string | null
          administrative_area_id: string | null
          created_at: string
          id: string
          is_approximate: boolean
          label: string
          latitude: number
          longitude: number
        }
        Insert: {
          access_notes?: string | null
          address_reference?: string | null
          administrative_area_id?: string | null
          created_at?: string
          id?: string
          is_approximate?: boolean
          label: string
          latitude: number
          longitude: number
        }
        Update: {
          access_notes?: string | null
          address_reference?: string | null
          administrative_area_id?: string | null
          created_at?: string
          id?: string
          is_approximate?: boolean
          label?: string
          latitude?: number
          longitude?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_points_administrative_area_id_fkey"
            columns: ["administrative_area_id"]
            isOneToOne: false
            referencedRelation: "administrative_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings: {
        Row: {
          actor_id: string
          available_from: string | null
          created_at: string
          deadline_at: string | null
          description: string | null
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_point_id: string
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_id: number
          updated_at: string
          variety_id: string | null
        }
        Insert: {
          actor_id: string
          available_from?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_point_id: string
          product_id: string
          quantity: number
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_id: number
          updated_at?: string
          variety_id?: string | null
        }
        Update: {
          actor_id?: string
          available_from?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_point_id?: string
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          unit_id?: number
          updated_at?: string
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_location_point_id_fkey"
            columns: ["location_point_id"]
            isOneToOne: false
            referencedRelation: "location_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "product_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_price_observations: {
        Row: {
          administrative_area_id: string | null
          created_at: string
          currency_id: number
          id: string
          market_name: string | null
          observed_on: string
          price_high: number | null
          price_low: number | null
          price_mid: number
          product_id: string
          quality_label: string | null
          quantity_basis: number
          source_id: number
          source_url: string | null
          unit_id: number
          variety_id: string | null
        }
        Insert: {
          administrative_area_id?: string | null
          created_at?: string
          currency_id: number
          id?: string
          market_name?: string | null
          observed_on: string
          price_high?: number | null
          price_low?: number | null
          price_mid: number
          product_id: string
          quality_label?: string | null
          quantity_basis?: number
          source_id: number
          source_url?: string | null
          unit_id: number
          variety_id?: string | null
        }
        Update: {
          administrative_area_id?: string | null
          created_at?: string
          currency_id?: number
          id?: string
          market_name?: string | null
          observed_on?: string
          price_high?: number | null
          price_low?: number | null
          price_mid?: number
          product_id?: string
          quality_label?: string | null
          quantity_basis?: number
          source_id?: number
          source_url?: string | null
          unit_id?: number
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_price_observations_administrative_area_id_fkey"
            columns: ["administrative_area_id"]
            isOneToOne: false
            referencedRelation: "administrative_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_observations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_observations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "price_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_observations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_observations_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "product_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          message_id: string
          mime_type: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          message_id: string
          mime_type: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          negotiation_id: string
          sender_actor_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          negotiation_id: string
          sender_actor_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          negotiation_id?: string
          sender_actor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_actor_id_fkey"
            columns: ["sender_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          action: string | null
          created_at: string
          details: string | null
          id: string
          listing_id: string
          moderator_notes: string | null
          reason: string
          reporter_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          moderator_notes?: string | null
          reason: string
          reporter_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          moderator_notes?: string | null
          reason?: string
          reporter_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_participants: {
        Row: {
          actor_id: string
          joined_at: string
          last_read_at: string | null
          negotiation_id: string
        }
        Insert: {
          actor_id: string
          joined_at?: string
          last_read_at?: string | null
          negotiation_id: string
        }
        Update: {
          actor_id?: string
          joined_at?: string
          last_read_at?: string | null
          negotiation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_participants_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiation_participants_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          buyer_actor_id: string
          created_at: string
          expires_at: string | null
          id: string
          mode: Database["public"]["Enums"]["negotiation_mode"]
          offer_listing_id: string | null
          producer_actor_id: string
          request_listing_id: string | null
          status: Database["public"]["Enums"]["negotiation_status"]
          updated_at: string
        }
        Insert: {
          buyer_actor_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          mode: Database["public"]["Enums"]["negotiation_mode"]
          offer_listing_id?: string | null
          producer_actor_id: string
          request_listing_id?: string | null
          status?: Database["public"]["Enums"]["negotiation_status"]
          updated_at?: string
        }
        Update: {
          buyer_actor_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["negotiation_mode"]
          offer_listing_id?: string | null
          producer_actor_id?: string
          request_listing_id?: string | null
          status?: Database["public"]["Enums"]["negotiation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_buyer_actor_id_fkey"
            columns: ["buyer_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_offer_listing_id_fkey"
            columns: ["offer_listing_id"]
            isOneToOne: false
            referencedRelation: "product_offers"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "negotiations_producer_actor_id_fkey"
            columns: ["producer_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_request_listing_id_fkey"
            columns: ["request_listing_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link_path: string | null
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_negotiation_policies: {
        Row: {
          attempt_window_minutes: number
          auto_accept_enabled: boolean
          conversational_window_hours: number
          currency_id: number
          max_quick_attempts: number
          offer_listing_id: string
          quick_negotiation_enabled: boolean
          reservation_minutes: number
          updated_at: string
        }
        Insert: {
          attempt_window_minutes?: number
          auto_accept_enabled?: boolean
          conversational_window_hours?: number
          currency_id: number
          max_quick_attempts?: number
          offer_listing_id: string
          quick_negotiation_enabled?: boolean
          reservation_minutes?: number
          updated_at?: string
        }
        Update: {
          attempt_window_minutes?: number
          auto_accept_enabled?: boolean
          conversational_window_hours?: number
          currency_id?: number
          max_quick_attempts?: number
          offer_listing_id?: string
          quick_negotiation_enabled?: boolean
          reservation_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_negotiation_policies_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_negotiation_policies_offer_listing_id_fkey"
            columns: ["offer_listing_id"]
            isOneToOne: true
            referencedRelation: "product_offers"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      offer_private_pricing: {
        Row: {
          hidden_floor_price: number
          offer_listing_id: string
          updated_at: string
        }
        Insert: {
          hidden_floor_price: number
          offer_listing_id: string
          updated_at?: string
        }
        Update: {
          hidden_floor_price?: number
          offer_listing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_private_pricing_offer_listing_id_fkey"
            columns: ["offer_listing_id"]
            isOneToOne: true
            referencedRelation: "offer_negotiation_policies"
            referencedColumns: ["offer_listing_id"]
          },
        ]
      }
      order_items: {
        Row: {
          agreed_unit_price: number
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_id: number
          variety_id: string | null
        }
        Insert: {
          agreed_unit_price: number
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_id: number
          variety_id?: string | null
        }
        Update: {
          agreed_unit_price?: number
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_id?: number
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commercial_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "product_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      order_negotiations: {
        Row: {
          negotiation_id: string
          order_id: string
        }
        Insert: {
          negotiation_id: string
          order_id: string
        }
        Update: {
          negotiation_id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_negotiations_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: true
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_negotiations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commercial_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_supplier_allocations: {
        Row: {
          allocated_quantity: number
          created_at: string
          id: string
          order_item_id: string
          producer_actor_id: string
          source_offer_listing_id: string | null
          unit_price: number
        }
        Insert: {
          allocated_quantity: number
          created_at?: string
          id?: string
          order_item_id: string
          producer_actor_id: string
          source_offer_listing_id?: string | null
          unit_price: number
        }
        Update: {
          allocated_quantity?: number
          created_at?: string
          id?: string
          order_item_id?: string
          producer_actor_id?: string
          source_offer_listing_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_supplier_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_supplier_allocations_producer_actor_id_fkey"
            columns: ["producer_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_supplier_allocations_source_offer_listing_id_fkey"
            columns: ["source_offer_listing_id"]
            isOneToOne: false
            referencedRelation: "product_offers"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          is_owner: boolean
          joined_at: string
          member_title: string | null
          organization_id: string
          status: Database["public"]["Enums"]["organization_member_status"]
          user_id: string
        }
        Insert: {
          is_owner?: boolean
          joined_at?: string
          member_title?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["organization_member_status"]
          user_id: string
        }
        Update: {
          is_owner?: boolean
          joined_at?: string
          member_title?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["organization_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          legal_name: string
          organization_type_id: number
          tax_identifier: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          legal_name: string
          organization_type_id: number
          tax_identifier?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          legal_name?: string
          organization_type_id?: number
          tax_identifier?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_organization_type_id_fkey"
            columns: ["organization_type_id"]
            isOneToOne: false
            referencedRelation: "organization_types"
            referencedColumns: ["id"]
          },
        ]
      }
      package_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      price_sources: {
        Row: {
          base_reliability: number
          code: string
          id: number
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          website_url: string | null
        }
        Insert: {
          base_reliability?: number
          code: string
          id?: number
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          website_url?: string | null
        }
        Update: {
          base_reliability?: number
          code?: string
          id?: number
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          website_url?: string | null
        }
        Relationships: []
      }
      price_suggestion_observations: {
        Row: {
          observation_id: string
          suggestion_id: string
          weight: number
        }
        Insert: {
          observation_id: string
          suggestion_id: string
          weight: number
        }
        Update: {
          observation_id?: string
          suggestion_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_suggestion_observations_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "market_price_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_suggestion_observations_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "listing_price_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_definitions: {
        Row: {
          code: string
          data_type: Database["public"]["Enums"]["attribute_data_type"]
          display_order: number
          id: string
          is_required_for_offer: boolean
          is_required_for_request: boolean
          name: string
          product_id: string
          unit_id: number | null
        }
        Insert: {
          code: string
          data_type: Database["public"]["Enums"]["attribute_data_type"]
          display_order?: number
          id?: string
          is_required_for_offer?: boolean
          is_required_for_request?: boolean
          name: string
          product_id: string
          unit_id?: number | null
        }
        Update: {
          code?: string
          data_type?: Database["public"]["Enums"]["attribute_data_type"]
          display_order?: number
          id?: string
          is_required_for_offer?: boolean
          is_required_for_request?: boolean
          name?: string
          product_id?: string
          unit_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_definitions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_definitions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_options: {
        Row: {
          attribute_definition_id: string
          code: string
          display_order: number
          id: string
          label: string
        }
        Insert: {
          attribute_definition_id: string
          code: string
          display_order?: number
          id?: string
          label: string
        }
        Update: {
          attribute_definition_id?: string
          code?: string
          display_order?: number
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_options_attribute_definition_id_fkey"
            columns: ["attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          id: number
          name: string
          parent_id: number | null
        }
        Insert: {
          code: string
          id?: number
          name: string
          parent_id?: number | null
        }
        Update: {
          code?: string
          id?: number
          name?: string
          parent_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          allow_partial_quantity: boolean
          created_at: string
          listing_id: string
          minimum_order_quantity: number | null
          reserved_quantity: number
        }
        Insert: {
          allow_partial_quantity?: boolean
          created_at?: string
          listing_id: string
          minimum_order_quantity?: number | null
          reserved_quantity?: number
        }
        Update: {
          allow_partial_quantity?: boolean
          created_at?: string
          listing_id?: string
          minimum_order_quantity?: number | null
          reserved_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_varieties: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          product_id: string
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          product_id: string
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_varieties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number
          code: string
          default_unit_id: number
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category_id: number
          code: string
          default_unit_id: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category_id?: number
          code?: string
          default_unit_id?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_attribute_values: {
        Row: {
          attribute_definition_id: string
          option_id: string | null
          proposal_id: string
          value_boolean: boolean | null
          value_date: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          attribute_definition_id: string
          option_id?: string | null
          proposal_id: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          attribute_definition_id?: string
          option_id?: string | null
          proposal_id?: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_attribute_values_attribute_definition_id_fkey"
            columns: ["attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_attribute_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_attribute_values_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          accepts_multiple_suppliers: boolean
          accepts_partial_offers: boolean
          created_at: string
          delivery_deadline: string | null
          listing_id: string
          requires_single_supplier: boolean
        }
        Insert: {
          accepts_multiple_suppliers?: boolean
          accepts_partial_offers?: boolean
          created_at?: string
          delivery_deadline?: string | null
          listing_id: string
          requires_single_supplier?: boolean
        }
        Update: {
          accepts_multiple_suppliers?: boolean
          accepts_partial_offers?: boolean
          created_at?: string
          delivery_deadline?: string | null
          listing_id?: string
          requires_single_supplier?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_offer_attempts: {
        Row: {
          buyer_actor_id: string
          created_at: string
          currency_id: number
          id: string
          negotiation_id: string | null
          offer_listing_id: string
          quantity: number
          result: Database["public"]["Enums"]["quick_offer_status"]
          unit_price: number
        }
        Insert: {
          buyer_actor_id: string
          created_at?: string
          currency_id: number
          id?: string
          negotiation_id?: string | null
          offer_listing_id: string
          quantity: number
          result: Database["public"]["Enums"]["quick_offer_status"]
          unit_price: number
        }
        Update: {
          buyer_actor_id?: string
          created_at?: string
          currency_id?: number
          id?: string
          negotiation_id?: string | null
          offer_listing_id?: string
          quantity?: number
          result?: Database["public"]["Enums"]["quick_offer_status"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_offer_attempts_buyer_actor_id_fkey"
            columns: ["buyer_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_offer_attempts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_offer_attempts_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_offer_attempts_offer_listing_id_fkey"
            columns: ["offer_listing_id"]
            isOneToOne: false
            referencedRelation: "product_offers"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      risk_event_evidence: {
        Row: {
          created_at: string
          evidence_confidence: number
          headline: string | null
          id: string
          notes: string | null
          published_at: string | null
          reporter_actor_id: string | null
          risk_event_id: string
          source_id: number | null
          source_url: string | null
        }
        Insert: {
          created_at?: string
          evidence_confidence: number
          headline?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          reporter_actor_id?: string | null
          risk_event_id: string
          source_id?: number | null
          source_url?: string | null
        }
        Update: {
          created_at?: string
          evidence_confidence?: number
          headline?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          reporter_actor_id?: string | null
          risk_event_id?: string
          source_id?: number | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_event_evidence_reporter_actor_id_fkey"
            columns: ["reporter_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_event_evidence_risk_event_id_fkey"
            columns: ["risk_event_id"]
            isOneToOne: false
            referencedRelation: "risk_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_event_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "risk_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_event_types: {
        Row: {
          code: string
          default_weight: number
          id: number
          name: string
        }
        Insert: {
          code: string
          default_weight: number
          id?: number
          name: string
        }
        Update: {
          code?: string
          default_weight?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          administrative_area_id: string | null
          affected_radius_km: number
          created_at: string
          ends_at: string | null
          event_type_id: number
          id: string
          latitude: number | null
          longitude: number | null
          road_name: string | null
          severity: number
          source_confidence: number
          starts_at: string | null
          status: Database["public"]["Enums"]["risk_event_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          administrative_area_id?: string | null
          affected_radius_km?: number
          created_at?: string
          ends_at?: string | null
          event_type_id: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity: number
          source_confidence: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["risk_event_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          administrative_area_id?: string | null
          affected_radius_km?: number
          created_at?: string
          ends_at?: string | null
          event_type_id?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity?: number
          source_confidence?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["risk_event_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_administrative_area_id_fkey"
            columns: ["administrative_area_id"]
            isOneToOne: false
            referencedRelation: "administrative_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "risk_event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_sources: {
        Row: {
          base_reliability: number
          code: string
          id: number
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          website_url: string | null
        }
        Insert: {
          base_reliability?: number
          code: string
          id?: number
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          website_url?: string | null
        }
        Update: {
          base_reliability?: number
          code?: string
          id?: number
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          website_url?: string | null
        }
        Relationships: []
      }
      route_plans: {
        Row: {
          calculated_at: string
          distance_km: number
          duration_minutes: number
          encoded_polyline: string | null
          id: string
          is_alternative: boolean
          provider: string
          route_label: string | null
          shipment_request_id: string
        }
        Insert: {
          calculated_at?: string
          distance_km: number
          duration_minutes: number
          encoded_polyline?: string | null
          id?: string
          is_alternative?: boolean
          provider: string
          route_label?: string | null
          shipment_request_id: string
        }
        Update: {
          calculated_at?: string
          distance_km?: number
          duration_minutes?: number
          encoded_polyline?: string | null
          id?: string
          is_alternative?: boolean
          provider?: string
          route_label?: string | null
          shipment_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_plans_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      route_risk_snapshot_events: {
        Row: {
          distance_to_route_km: number | null
          impact_score: number
          risk_event_id: string
          snapshot_id: string
        }
        Insert: {
          distance_to_route_km?: number | null
          impact_score: number
          risk_event_id: string
          snapshot_id: string
        }
        Update: {
          distance_to_route_km?: number | null
          impact_score?: number
          risk_event_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_risk_snapshot_events_risk_event_id_fkey"
            columns: ["risk_event_id"]
            isOneToOne: false
            referencedRelation: "risk_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_risk_snapshot_events_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "route_risk_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      route_risk_snapshots: {
        Row: {
          access_risk: number
          calculated_at: string
          currency_id: number | null
          estimated_delay_minutes: number
          explanation: string
          extra_cost_high: number | null
          extra_cost_low: number | null
          id: string
          information_confidence: number
          infrastructure_risk: number
          method_version: string
          operational_risk: number
          risk_score: number
          route_plan_id: string
          social_risk: number
          weather_risk: number
        }
        Insert: {
          access_risk: number
          calculated_at?: string
          currency_id?: number | null
          estimated_delay_minutes?: number
          explanation: string
          extra_cost_high?: number | null
          extra_cost_low?: number | null
          id?: string
          information_confidence: number
          infrastructure_risk: number
          method_version: string
          operational_risk: number
          risk_score: number
          route_plan_id: string
          social_risk: number
          weather_risk: number
        }
        Update: {
          access_risk?: number
          calculated_at?: string
          currency_id?: number | null
          estimated_delay_minutes?: number
          explanation?: string
          extra_cost_high?: number | null
          extra_cost_low?: number | null
          id?: string
          information_confidence?: number
          infrastructure_risk?: number
          method_version?: string
          operational_risk?: number
          risk_score?: number
          route_plan_id?: string
          social_risk?: number
          weather_risk?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_risk_snapshots_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_risk_snapshots_route_plan_id_fkey"
            columns: ["route_plan_id"]
            isOneToOne: false
            referencedRelation: "route_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_actors: {
        Row: {
          actor_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_actors_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_actors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listing_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_assignments: {
        Row: {
          accepted_at: string
          accepted_by_actor_id: string
          freight_bid_id: string
          id: string
          shipment_request_id: string
        }
        Insert: {
          accepted_at?: string
          accepted_by_actor_id: string
          freight_bid_id: string
          id?: string
          shipment_request_id: string
        }
        Update: {
          accepted_at?: string
          accepted_by_actor_id?: string
          freight_bid_id?: string
          id?: string
          shipment_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_assignments_accepted_by_actor_id_fkey"
            columns: ["accepted_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_assignments_freight_bid_id_fkey"
            columns: ["freight_bid_id"]
            isOneToOne: true
            referencedRelation: "freight_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_assignments_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: true
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_cargo_items: {
        Row: {
          allocation_id: string | null
          id: string
          notes: string | null
          package_count: number | null
          package_type_id: number | null
          shipment_request_id: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          allocation_id?: string | null
          id?: string
          notes?: string | null
          package_count?: number | null
          package_type_id?: number | null
          shipment_request_id: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          allocation_id?: string | null
          id?: string
          notes?: string | null
          package_count?: number | null
          package_type_id?: number | null
          shipment_request_id?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_cargo_items_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "order_supplier_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_cargo_items_package_type_id_fkey"
            columns: ["package_type_id"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_cargo_items_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_requests: {
        Row: {
          cargo_description: string | null
          created_at: string
          currency_id: number | null
          destination_label: string | null
          id: string
          loading_notes: string | null
          logistics_mode: Database["public"]["Enums"]["logistics_mode"]
          needs_helper: boolean
          order_id: string
          origin_label: string | null
          package_count: number | null
          requested_by_actor_id: string
          scheduled_pickup_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          suggested_fare: number | null
          total_volume_m3: number | null
          total_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          cargo_description?: string | null
          created_at?: string
          currency_id?: number | null
          destination_label?: string | null
          id?: string
          loading_notes?: string | null
          logistics_mode: Database["public"]["Enums"]["logistics_mode"]
          needs_helper?: boolean
          order_id: string
          origin_label?: string | null
          package_count?: number | null
          requested_by_actor_id: string
          scheduled_pickup_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          suggested_fare?: number | null
          total_volume_m3?: number | null
          total_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          cargo_description?: string | null
          created_at?: string
          currency_id?: number | null
          destination_label?: string | null
          id?: string
          loading_notes?: string | null
          logistics_mode?: Database["public"]["Enums"]["logistics_mode"]
          needs_helper?: boolean
          order_id?: string
          origin_label?: string | null
          package_count?: number | null
          requested_by_actor_id?: string
          scheduled_pickup_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          suggested_fare?: number | null
          total_volume_m3?: number | null
          total_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commercial_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_requested_by_actor_id_fkey"
            columns: ["requested_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_stops: {
        Row: {
          actor_id: string | null
          id: string
          location_point_id: string
          notes: string | null
          planned_at: string | null
          sequence_number: number
          shipment_request_id: string
          stop_type: Database["public"]["Enums"]["stop_type"]
        }
        Insert: {
          actor_id?: string | null
          id?: string
          location_point_id: string
          notes?: string | null
          planned_at?: string | null
          sequence_number: number
          shipment_request_id: string
          stop_type: Database["public"]["Enums"]["stop_type"]
        }
        Update: {
          actor_id?: string | null
          id?: string
          location_point_id?: string
          notes?: string | null
          planned_at?: string | null
          sequence_number?: number
          shipment_request_id?: string
          stop_type?: Database["public"]["Enums"]["stop_type"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_stops_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_stops_location_point_id_fkey"
            columns: ["location_point_id"]
            isOneToOne: false
            referencedRelation: "location_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_stops_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_evidence: {
        Row: {
          byte_size: number | null
          captured_at: string
          captured_by_actor_id: string | null
          content_type: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          id: string
          metadata: Json
          notes: string | null
          original_filename: string | null
          recorded_weight: number | null
          shipment_stop_id: string | null
          storage_path: string | null
          trip_id: string
        }
        Insert: {
          byte_size?: number | null
          captured_at?: string
          captured_by_actor_id?: string | null
          content_type?: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          id?: string
          metadata?: Json
          notes?: string | null
          original_filename?: string | null
          recorded_weight?: number | null
          shipment_stop_id?: string | null
          storage_path?: string | null
          trip_id: string
        }
        Update: {
          byte_size?: number | null
          captured_at?: string
          captured_by_actor_id?: string | null
          content_type?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"]
          id?: string
          metadata?: Json
          notes?: string | null
          original_filename?: string | null
          recorded_weight?: number | null
          shipment_stop_id?: string | null
          storage_path?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_evidence_captured_by_actor_id_fkey"
            columns: ["captured_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evidence_shipment_stop_id_fkey"
            columns: ["shipment_stop_id"]
            isOneToOne: false
            referencedRelation: "shipment_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evidence_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_incidents: {
        Row: {
          description: string
          id: string
          incident_type: string
          location_label: string | null
          reported_at: string
          reported_by_actor_id: string
          resolved_at: string | null
          trip_id: string
        }
        Insert: {
          description: string
          id?: string
          incident_type: string
          location_label?: string | null
          reported_at?: string
          reported_by_actor_id: string
          resolved_at?: string | null
          trip_id: string
        }
        Update: {
          description?: string
          id?: string
          incident_type?: string
          location_label?: string | null
          reported_at?: string
          reported_by_actor_id?: string
          resolved_at?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_incidents_reported_by_actor_id_fkey"
            columns: ["reported_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_incidents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_operation_records: {
        Row: {
          accepted_quantity: number | null
          condition_notes: string | null
          confirmed: boolean
          id: string
          notes: string | null
          observed_quantity: number | null
          package_count: number | null
          record_type: string
          recorded_at: string
          recorded_by_actor_id: string
          recorded_weight_kg: number | null
          trip_id: string
        }
        Insert: {
          accepted_quantity?: number | null
          condition_notes?: string | null
          confirmed?: boolean
          id?: string
          notes?: string | null
          observed_quantity?: number | null
          package_count?: number | null
          record_type: string
          recorded_at?: string
          recorded_by_actor_id: string
          recorded_weight_kg?: number | null
          trip_id: string
        }
        Update: {
          accepted_quantity?: number | null
          condition_notes?: string | null
          confirmed?: boolean
          id?: string
          notes?: string | null
          observed_quantity?: number | null
          package_count?: number | null
          record_type?: string
          recorded_at?: string
          recorded_by_actor_id?: string
          recorded_weight_kg?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_operation_records_recorded_by_actor_id_fkey"
            columns: ["recorded_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_operation_records_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_status_history: {
        Row: {
          changed_by_actor_id: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["trip_status"]
          trip_id: string
        }
        Insert: {
          changed_by_actor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["trip_status"]
          trip_id: string
        }
        Update: {
          changed_by_actor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_status_history_changed_by_actor_id_fkey"
            columns: ["changed_by_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_status_history_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          shipment_assignment_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          shipment_assignment_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          shipment_assignment_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_shipment_assignment_id_fkey"
            columns: ["shipment_assignment_id"]
            isOneToOne: true
            referencedRelation: "shipment_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          code: string
          dimension: string
          id: number
          name: string
          symbol: string
        }
        Insert: {
          code: string
          dimension: string
          id?: number
          name: string
          symbol: string
        }
        Update: {
          code?: string
          dimension?: string
          id?: number
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_body_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      vehicle_document_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          document_number: string | null
          document_type_id: number
          expires_at: string | null
          id: string
          issued_at: string | null
          storage_path: string | null
          vehicle_id: string
          verified_at: string | null
        }
        Insert: {
          document_number?: string | null
          document_type_id: number
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          storage_path?: string | null
          vehicle_id: string
          verified_at?: string | null
        }
        Update: {
          document_number?: string | null
          document_type_id?: number
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          storage_path?: string | null
          vehicle_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type_id: number | null
          capacity_kg: number
          capacity_m3: number | null
          covered: boolean
          created_at: string
          display_name: string | null
          four_wheel_drive: boolean
          id: string
          is_available: boolean
          owner_actor_id: string
          plate: string | null
          refrigerated: boolean
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          vehicle_type_id: number
        }
        Insert: {
          body_type_id?: number | null
          capacity_kg: number
          capacity_m3?: number | null
          covered?: boolean
          created_at?: string
          display_name?: string | null
          four_wheel_drive?: boolean
          id?: string
          is_available?: boolean
          owner_actor_id: string
          plate?: string | null
          refrigerated?: boolean
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vehicle_type_id: number
        }
        Update: {
          body_type_id?: number | null
          capacity_kg?: number
          capacity_m3?: number | null
          covered?: boolean
          created_at?: string
          display_name?: string | null
          four_wheel_drive?: boolean
          id?: string
          is_available?: boolean
          owner_actor_id?: string
          plate?: string | null
          refrigerated?: boolean
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vehicle_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_body_type_id_fkey"
            columns: ["body_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_body_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owner_actor_id_fkey"
            columns: ["owner_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          actor_id: string
          applicant_notes: string | null
          created_at: string
          document_paths: Json
          id: string
          requested_status_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          applicant_notes?: string | null
          created_at?: string
          document_paths?: Json
          id?: string
          requested_status_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          applicant_notes?: string | null
          created_at?: string
          document_paths?: Json
          id?: string
          requested_status_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_requested_status_id_fkey"
            columns: ["requested_status_id"]
            isOneToOne: false
            referencedRelation: "verification_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_statuses: {
        Row: {
          code: string
          id: number
          name: string
          rank: number
        }
        Insert: {
          code: string
          id?: number
          name: string
          rank?: number
        }
        Update: {
          code?: string
          id?: number
          name?: string
          rank?: number
        }
        Relationships: []
      }
    }
    Views: {
      marketplace_listing_public: {
        Row: {
          accepts_multiple_suppliers: boolean | null
          accepts_partial_offers: boolean | null
          actor_display_name: string | null
          actor_id: string | null
          allow_partial_quantity: boolean | null
          available_from: string | null
          created_at: string | null
          deadline_at: string | null
          description: string | null
          id: string | null
          is_approximate: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          location_label: string | null
          location_point_id: string | null
          minimum_order_quantity: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          quick_negotiation_enabled: boolean | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string | null
          unit_id: number | null
          unit_symbol: string | null
          variety_id: string | null
          variety_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_location_point_id_fkey"
            columns: ["location_point_id"]
            isOneToOne: false
            referencedRelation: "location_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "product_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      account_complete_onboarding: {
        Args: {
          p_actor_id: string
          p_details: Json
          p_name?: string
          p_phone?: string
          p_role_code: string
          p_vehicle?: Json
        }
        Returns: undefined
      }
      account_get_dashboard: { Args: { p_actor_id: string }; Returns: Json }
      account_get_settings: { Args: { p_actor_id: string }; Returns: Json }
      account_get_verification: { Args: { p_actor_id: string }; Returns: Json }
      account_set_operational_roles: {
        Args: { p_actor_id: string; p_role_codes: string[] }
        Returns: string[]
      }
      account_submit_verification: {
        Args: { p_actor_id: string; p_notes?: string }
        Returns: string
      }
      account_update_settings: {
        Args: {
          p_actor_id: string
          p_approximate_location_only: boolean
          p_language: string
          p_name: string
          p_notifications: Json
          p_phone: string
        }
        Returns: undefined
      }
      add_trip_evidence: {
        Args: {
          p_actor_id: string
          p_byte_size: number
          p_content_type: string
          p_evidence_type: Database["public"]["Enums"]["evidence_type"]
          p_notes?: string
          p_original_filename: string
          p_storage_path: string
          p_trip_id: string
        }
        Returns: string
      }
      bootstrap_actor: {
        Args: {
          p_display_name?: string
          p_profile_kind: string
          p_role_codes: string[]
        }
        Returns: string
      }
      can_access_order: { Args: { target_order_id: string }; Returns: boolean }
      can_access_shipment: {
        Args: { target_shipment_id: string }
        Returns: boolean
      }
      can_act_as: { Args: { target_actor_id: string }; Returns: boolean }
      can_manage_trip: { Args: { target_trip_id: string }; Returns: boolean }
      commerce_create_conversation: {
        Args: { p_actor_id: string; p_listing_id: string }
        Returns: {
          expires_at: string
          negotiation_id: string
          reused: boolean
        }[]
      }
      commerce_create_proposal: {
        Args: {
          p_actor_id: string
          p_currency_code: string
          p_delivery_date?: string
          p_expires_at?: string
          p_logistics_mode?: Database["public"]["Enums"]["logistics_mode"]
          p_negotiation_id: string
          p_quantity: number
          p_supersedes_proposal_id?: string
          p_unit_price: number
        }
        Returns: Json
      }
      commerce_get_negotiation: {
        Args: { p_actor_id: string; p_negotiation_id: string }
        Returns: Json
      }
      commerce_get_order: {
        Args: { p_actor_id: string; p_order_id: string }
        Returns: Json
      }
      commerce_list_negotiations: {
        Args: { p_actor_id: string }
        Returns: Json
      }
      commerce_list_orders: { Args: { p_actor_id: string }; Returns: Json }
      commerce_respond_to_proposal: {
        Args: {
          p_accept: boolean
          p_actor_id: string
          p_negotiation_id: string
          p_proposal_id: string
        }
        Returns: {
          order_id: string
          proposal_status: Database["public"]["Enums"]["proposal_status"]
          reservation_expires_at: string
        }[]
      }
      commerce_send_message: {
        Args: { p_actor_id: string; p_body: string; p_negotiation_id: string }
        Returns: Json
      }
      commerce_submit_quick_offer: {
        Args: {
          p_buyer_actor_id: string
          p_currency_code: string
          p_offer_listing_id: string
          p_quantity: number
          p_unit_price: number
        }
        Returns: {
          attempts_remaining: number
          negotiation_id: string
          order_id: string
          reservation_expires_at: string
          result: Database["public"]["Enums"]["quick_offer_status"]
        }[]
      }
      confirm_risk_candidate: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      create_market_offer: {
        Args: {
          p_actor_id: string
          p_allow_partial_quantity: boolean
          p_available_from: string
          p_conversational_window_hours: number
          p_description: string
          p_hidden_floor_price: number
          p_latitude: number
          p_location_label: string
          p_longitude: number
          p_minimum_order_quantity: number
          p_product_id: string
          p_publish?: boolean
          p_quantity: number
          p_quick_negotiation_enabled: boolean
          p_title: string
          p_unit_id: number
          p_variety_id: string
        }
        Returns: string
      }
      create_purchase_request: {
        Args: {
          p_accepts_multiple_suppliers: boolean
          p_accepts_partial_offers: boolean
          p_actor_id: string
          p_deadline_at: string
          p_delivery_deadline: string
          p_description: string
          p_latitude: number
          p_location_label: string
          p_longitude: number
          p_product_id: string
          p_publish?: boolean
          p_quantity: number
          p_title: string
          p_unit_id: number
          p_variety_id: string
        }
        Returns: string
      }
      create_risk_event_with_evidence:
        | {
            Args: {
              p_affected_radius_km: number
              p_ends_at: string
              p_event_type_code: string
              p_latitude: number
              p_longitude: number
              p_road_name: string
              p_severity: number
              p_source_confidence: number
              p_source_url: string
              p_starts_at: string
              p_status: Database["public"]["Enums"]["risk_event_status"]
              p_summary: string
              p_title: string
            }
            Returns: string
          }
        | { Args: { p_payload: Json }; Returns: string }
      delete_vehicle: {
        Args: { p_actor_id: string; p_vehicle_id: string }
        Returns: undefined
      }
      get_active_marketplace_listings: {
        Args: {
          p_limit?: number
          p_listing_id?: string
          p_listing_type?: Database["public"]["Enums"]["listing_type"]
          p_query?: string
        }
        Returns: {
          accepts_multiple_suppliers: boolean
          accepts_partial_offers: boolean
          actor_display_name: string
          actor_id: string
          allow_partial_quantity: boolean
          available_from: string
          conversational_window_hours: number
          created_at: string
          deadline_at: string
          description: string
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_label: string
          minimum_order_quantity: number
          product_id: string
          product_name: string
          quantity: number
          quick_negotiation_enabled: boolean
          saved: boolean
          title: string
          unit_id: number
          unit_symbol: string
          variety_id: string
          variety_name: string
        }[]
      }
      get_my_actor_context: {
        Args: never
        Returns: {
          actor_id: string
          display_name: string
          role_codes: string[]
        }[]
      }
      get_public_actor_profile: { Args: { p_actor_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_assigned_trip_actor: {
        Args: { target_actor_id: string; target_trip_id: string }
        Returns: boolean
      }
      publish_shipment: {
        Args: { p_actor_id: string; p_shipment_id: string }
        Returns: string
      }
      record_and_transition_trip_operation: {
        Args: {
          p_accepted_quantity: number
          p_actor_id: string
          p_condition_notes: string
          p_confirmed: boolean
          p_notes: string
          p_observed_quantity: number
          p_package_count: number
          p_record_type: string
          p_trip_id: string
          p_weight_kg: number
        }
        Returns: string
      }
      record_trip_operation: {
        Args: {
          p_accepted_quantity: number
          p_actor_id: string
          p_condition_notes: string
          p_confirmed: boolean
          p_notes: string
          p_observed_quantity: number
          p_package_count: number
          p_record_type: string
          p_trip_id: string
          p_weight_kg: number
        }
        Returns: string
      }
      release_expired_inventory_reservations: { Args: never; Returns: number }
      report_trip_incident: {
        Args: {
          p_actor_id: string
          p_description: string
          p_incident_type: string
          p_location_label?: string
          p_trip_id: string
        }
        Returns: string
      }
      review_moderation_report: {
        Args: {
          p_action?: string
          p_notes?: string
          p_report_id: string
          p_status: string
        }
        Returns: undefined
      }
      review_verification_request: {
        Args: { p_notes?: string; p_request_id: string; p_status: string }
        Returns: undefined
      }
      save_shipment_draft: {
        Args: {
          p_actor_id: string
          p_cargo_description?: string
          p_destination_label?: string
          p_loading_notes?: string
          p_logistics_mode: Database["public"]["Enums"]["logistics_mode"]
          p_needs_helper?: boolean
          p_order_id: string
          p_origin_label?: string
          p_package_count?: number
          p_scheduled_pickup_at?: string
          p_suggested_fare?: number
          p_volume_m3?: number
          p_weight_kg?: number
        }
        Returns: string
      }
      save_vehicle: {
        Args: {
          p_actor_id: string
          p_capacity_kg: number
          p_capacity_m3: number
          p_covered: boolean
          p_display_name: string
          p_four_wheel_drive: boolean
          p_plate: string
          p_refrigerated: boolean
          p_vehicle_id: string
          p_vehicle_type_code: string
        }
        Returns: string
      }
      select_freight_bid: {
        Args: { p_actor_id: string; p_bid_id: string }
        Returns: string
      }
      set_vehicle_availability: {
        Args: { p_actor_id: string; p_available: boolean; p_vehicle_id: string }
        Returns: undefined
      }
      submit_freight_bid: {
        Args: {
          p_actor_id: string
          p_conditions?: string
          p_departure_at: string
          p_duration_minutes: number
          p_fare: number
          p_helper_included?: boolean
          p_insurance_included?: boolean
          p_shipment_id: string
          p_vehicle_id: string
        }
        Returns: string
      }
      submit_quick_offer: {
        Args: {
          p_buyer_actor_id: string
          p_currency_code: string
          p_offer_listing_id: string
          p_quantity: number
          p_unit_price: number
        }
        Returns: {
          attempts_remaining: number
          negotiation_id: string
          order_id: string
          reservation_expires_at: string
          result: Database["public"]["Enums"]["quick_offer_status"]
        }[]
      }
      toggle_saved_actor: { Args: { p_actor_id: string }; Returns: boolean }
      toggle_saved_listing: { Args: { p_listing_id: string }; Returns: boolean }
      transition_trip: {
        Args: {
          p_actor_id: string
          p_notes?: string
          p_status: Database["public"]["Enums"]["trip_status"]
          p_trip_id: string
        }
        Returns: undefined
      }
      withdraw_freight_bid: {
        Args: { p_actor_id: string; p_bid_id: string }
        Returns: undefined
      }
    }
    Enums: {
      actor_kind: "PERSON" | "ORGANIZATION"
      analysis_provider: "GEMINI" | "RULE_ENGINE" | "MANUAL"
      analysis_status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED"
      attribute_data_type: "TEXT" | "NUMBER" | "BOOLEAN" | "OPTION" | "DATE"
      bid_status: "ACTIVE" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "EXPIRED"
      evidence_type:
        | "PICKUP_PHOTO"
        | "DELIVERY_PHOTO"
        | "WEIGHT_TICKET"
        | "SIGNATURE"
        | "DOCUMENT"
        | "OTHER"
      listing_status:
        | "DRAFT"
        | "ACTIVE"
        | "PAUSED"
        | "CLOSED"
        | "SOLD_OUT"
        | "CANCELLED"
      listing_type: "OFFER" | "REQUEST"
      logistics_mode:
        | "BUYER_PICKUP"
        | "PRODUCER_DELIVERY"
        | "MARKETPLACE_FREIGHT"
      message_type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "PROPOSAL_REFERENCE"
      negotiation_mode: "QUICK" | "CONVERSATIONAL"
      negotiation_status:
        | "OPEN"
        | "OFFER_SUBMITTED"
        | "AUTO_ACCEPTED"
        | "NOT_ACCEPTED"
        | "COUNTERED"
        | "ACCEPTED"
        | "REJECTED"
        | "EXPIRED"
        | "CANCELLED"
      notification_status: "UNREAD" | "READ" | "ARCHIVED"
      order_status:
        | "RESERVED"
        | "PENDING_LOGISTICS"
        | "CONFIRMED"
        | "READY_FOR_PICKUP"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "OBSERVED"
        | "COMPLETED"
        | "CANCELLED"
        | "EXPIRED"
      organization_member_status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED"
      proposal_status:
        | "ACTIVE"
        | "ACCEPTED"
        | "REJECTED"
        | "SUPERSEDED"
        | "EXPIRED"
      quick_offer_status:
        | "AUTO_ACCEPTED"
        | "NOT_ACCEPTED"
        | "UNAVAILABLE"
        | "RATE_LIMITED"
      reservation_status:
        | "ACTIVE"
        | "CONSUMED"
        | "RELEASED"
        | "EXPIRED"
        | "CANCELLED"
      risk_event_status:
        | "DETECTED"
        | "UNCONFIRMED"
        | "CONFIRMED"
        | "ACTIVE"
        | "RESOLVED"
        | "DISCARDED"
        | "STALE"
      shipment_status:
        | "DRAFT"
        | "OPEN_FOR_BIDS"
        | "TRANSPORTER_SELECTED"
        | "SCHEDULED"
        | "PICKED_UP"
        | "IN_TRANSIT"
        | "DELAYED"
        | "DELIVERED"
        | "CANCELLED"
      source_type: "OFFICIAL" | "NEWS" | "SOCIAL" | "USER_REPORT" | "MANUAL"
      stop_type: "PICKUP" | "DELIVERY" | "WAYPOINT"
      trip_status:
        | "SCHEDULED"
        | "PICKED_UP"
        | "IN_TRANSIT"
        | "DELAYED"
        | "DELIVERED"
        | "CANCELLED"
      vehicle_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
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
      actor_kind: ["PERSON", "ORGANIZATION"],
      analysis_provider: ["GEMINI", "RULE_ENGINE", "MANUAL"],
      analysis_status: ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"],
      attribute_data_type: ["TEXT", "NUMBER", "BOOLEAN", "OPTION", "DATE"],
      bid_status: ["ACTIVE", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"],
      evidence_type: [
        "PICKUP_PHOTO",
        "DELIVERY_PHOTO",
        "WEIGHT_TICKET",
        "SIGNATURE",
        "DOCUMENT",
        "OTHER",
      ],
      listing_status: [
        "DRAFT",
        "ACTIVE",
        "PAUSED",
        "CLOSED",
        "SOLD_OUT",
        "CANCELLED",
      ],
      listing_type: ["OFFER", "REQUEST"],
      logistics_mode: [
        "BUYER_PICKUP",
        "PRODUCER_DELIVERY",
        "MARKETPLACE_FREIGHT",
      ],
      message_type: ["TEXT", "IMAGE", "FILE", "SYSTEM", "PROPOSAL_REFERENCE"],
      negotiation_mode: ["QUICK", "CONVERSATIONAL"],
      negotiation_status: [
        "OPEN",
        "OFFER_SUBMITTED",
        "AUTO_ACCEPTED",
        "NOT_ACCEPTED",
        "COUNTERED",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "CANCELLED",
      ],
      notification_status: ["UNREAD", "READ", "ARCHIVED"],
      order_status: [
        "RESERVED",
        "PENDING_LOGISTICS",
        "CONFIRMED",
        "READY_FOR_PICKUP",
        "IN_TRANSIT",
        "DELIVERED",
        "OBSERVED",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
      ],
      organization_member_status: ["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"],
      proposal_status: [
        "ACTIVE",
        "ACCEPTED",
        "REJECTED",
        "SUPERSEDED",
        "EXPIRED",
      ],
      quick_offer_status: [
        "AUTO_ACCEPTED",
        "NOT_ACCEPTED",
        "UNAVAILABLE",
        "RATE_LIMITED",
      ],
      reservation_status: [
        "ACTIVE",
        "CONSUMED",
        "RELEASED",
        "EXPIRED",
        "CANCELLED",
      ],
      risk_event_status: [
        "DETECTED",
        "UNCONFIRMED",
        "CONFIRMED",
        "ACTIVE",
        "RESOLVED",
        "DISCARDED",
        "STALE",
      ],
      shipment_status: [
        "DRAFT",
        "OPEN_FOR_BIDS",
        "TRANSPORTER_SELECTED",
        "SCHEDULED",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELAYED",
        "DELIVERED",
        "CANCELLED",
      ],
      source_type: ["OFFICIAL", "NEWS", "SOCIAL", "USER_REPORT", "MANUAL"],
      stop_type: ["PICKUP", "DELIVERY", "WAYPOINT"],
      trip_status: [
        "SCHEDULED",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELAYED",
        "DELIVERED",
        "CANCELLED",
      ],
      vehicle_status: ["ACTIVE", "INACTIVE", "SUSPENDED"],
    },
  },
} as const
