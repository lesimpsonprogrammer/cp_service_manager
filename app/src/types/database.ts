// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked
// to a live Supabase project, and this file becomes redundant.

export type OrgRole = "owner" | "admin" | "member" | "viewer";

export type DataSourceType =
  | "spreadsheet"
  | "google_sheets"
  | "rest_api"
  | "sql_database"
  | "hcm"
  | "erp"
  | "webhook";

export type DataSourceStatus = "connected" | "disconnected" | "error" | "pending";

export type PipelineRunStatus = "queued" | "running" | "succeeded" | "failed" | "partial";

export type WebhookDirection = "inbound" | "outbound";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      org_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["org_members"]["Row"]> & {
          org_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_members"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      data_sources: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          type: DataSourceType;
          status: DataSourceStatus;
          config: Record<string, unknown>;
          secret_ref: string | null;
          last_synced_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["data_sources"]["Row"]> & {
          org_id: string;
          name: string;
          type: DataSourceType;
        };
        Update: Partial<Database["public"]["Tables"]["data_sources"]["Row"]>;
        Relationships: [];
      };
      pipelines: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          source_id: string;
          destination_id: string | null;
          mapping: Array<{ source: string; target: string }>;
          transform_steps: Array<Record<string, unknown>>;
          schedule: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pipelines"]["Row"]> & {
          org_id: string;
          name: string;
          source_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipelines"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pipelines_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipelines_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          }
        ];
      };
      pipeline_runs: {
        Row: {
          id: string;
          pipeline_id: string;
          org_id: string;
          status: PipelineRunStatus;
          records_extracted: number;
          records_loaded: number;
          records_failed: number;
          error: string | null;
          triggered_by: string;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pipeline_runs"]["Row"]> & {
          pipeline_id: string;
          org_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_runs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          }
        ];
      };
      webhooks: {
        Row: {
          id: string;
          org_id: string;
          direction: WebhookDirection;
          name: string;
          target_url: string | null;
          events: string[];
          data_source_id: string | null;
          inbound_token: string | null;
          secret: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webhooks"]["Row"]> & {
          org_id: string;
          direction: WebhookDirection;
          name: string;
          secret: string;
        };
        Update: Partial<Database["public"]["Tables"]["webhooks"]["Row"]>;
        Relationships: [];
      };
      webhook_deliveries: {
        Row: {
          id: string;
          webhook_id: string;
          org_id: string;
          event: string;
          direction: WebhookDirection;
          payload: Record<string, unknown>;
          response_status: number | null;
          success: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webhook_deliveries"]["Row"]> & {
          webhook_id: string;
          org_id: string;
          event: string;
          direction: WebhookDirection;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_deliveries"]["Row"]>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at: string | null;
          created_by: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["api_keys"]["Row"]> & {
          org_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
