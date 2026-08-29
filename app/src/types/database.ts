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
  | "tax_filing"
  | "webhook";

export type DataSourceStatus = "connected" | "disconnected" | "error" | "pending";

export type PipelineRunStatus = "queued" | "running" | "succeeded" | "failed" | "partial";

export type WebhookDirection = "inbound" | "outbound";

export type ClientStatus = "active" | "prospect" | "inactive";

export type OnboardingStage =
  | "not_started"
  | "contract_sent"
  | "contract_signed"
  | "in_progress"
  | "completed";

export type ContractStatus = "draft" | "sent" | "signed" | "active" | "expired" | "terminated";

export type TimecardStatus = "draft" | "internally_approved" | "sent" | "client_approved" | "client_rejected";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export type SignupRequestStatus = "pending" | "approved" | "rejected";

export type ProjectStatus = "intake" | "in_progress" | "client_review" | "complete";

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
          password_updated_at: string;
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
          client_id: string | null;
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
        Relationships: [
          {
            foreignKeyName: "data_sources_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          status: ClientStatus;
          onboarding_stage: OnboardingStage;
          primary_contact_name: string | null;
          primary_contact_email: string | null;
          primary_contact_phone: string | null;
          notes: string | null;
          billing_contact_name: string | null;
          billing_contact_email: string | null;
          billing_contact_phone: string | null;
          momentum_billing_contact_name: string | null;
          momentum_billing_contact_email: string | null;
          payment_terms: string | null;
          payment_method: string | null;
          compliance_frameworks: string[];
          hipaa_covered_entity: boolean;
          compliance_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      client_contracts: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          name: string;
          status: ContractStatus;
          start_date: string | null;
          end_date: string | null;
          value: number | null;
          notes: string | null;
          client_address: string | null;
          services_description: string | null;
          hourly_rate: number | null;
          contract_number: string;
          signing_token: string;
          approved_at: string | null;
          approved_by: string | null;
          sent_at: string | null;
          signed_at: string | null;
          signer_name: string | null;
          signer_email: string | null;
          signed_by_name: string | null;
          signer_ip: string | null;
          reminder_count: number;
          last_reminder_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_contracts"]["Row"]> & {
          org_id: string;
          client_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_contracts"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "client_contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
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
          run_number: string;
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
      projects: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          name: string;
          project_code: string;
          status: ProjectStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          org_id: string;
          client_id: string;
          name: string;
          project_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      time_entries: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          project_id: string;
          contract_id: string | null;
          work_date: string;
          hours: number;
          description: string | null;
          billable: boolean;
          timecard_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["time_entries"]["Row"]> & {
          org_id: string;
          client_id: string;
          project_id: string;
          hours: number;
        };
        Update: Partial<Database["public"]["Tables"]["time_entries"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "client_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_timecard_id_fkey";
            columns: ["timecard_id"];
            isOneToOne: false;
            referencedRelation: "timecards";
            referencedColumns: ["id"];
          }
        ];
      };
      timecards: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          period_start: string;
          period_end: string;
          timecard_number: string;
          status: TimecardStatus;
          total_hours: number;
          total_amount: number | null;
          internal_approval_id: string | null;
          internal_approved_at: string | null;
          internal_approved_by: string | null;
          approval_token: string;
          approver_name: string | null;
          approver_email: string | null;
          sent_at: string | null;
          client_approved_at: string | null;
          client_approved_by_name: string | null;
          client_rejected_at: string | null;
          rejection_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["timecards"]["Row"]> & {
          org_id: string;
          client_id: string;
          period_start: string;
          period_end: string;
        };
        Update: Partial<Database["public"]["Tables"]["timecards"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "timecards_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      docs: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          slug: string;
          body: string;
          category: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["docs"]["Row"]> & {
          org_id: string;
          title: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["docs"]["Row"]>;
        Relationships: [];
      };
      agreement_templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          body: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["agreement_templates"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["agreement_templates"]["Row"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          contract_id: string | null;
          timecard_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          notes: string | null;
          billing_contact_name: string | null;
          billing_contact_email: string | null;
          sent_at: string | null;
          paid_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          org_id: string;
          client_id: string;
          invoice_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "client_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_timecard_id_fkey";
            columns: ["timecard_id"];
            isOneToOne: false;
            referencedRelation: "timecards";
            referencedColumns: ["id"];
          }
        ];
      };
      org_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: OrgRole;
          token: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["org_invites"]["Row"]> & {
          org_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_invites"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      signup_requests: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          status: SignupRequestStatus;
          decided_at: string | null;
          decided_by: string | null;
          decision_org_id: string | null;
          decision_role: OrgRole | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["signup_requests"]["Row"]> & {
          user_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["signup_requests"]["Row"]>;
        Relationships: [];
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          org_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_line_items"]["Row"]> & {
          invoice_id: string;
          org_id: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_line_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
      client_portal_users: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          email: string;
          password_updated_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_portal_users"]["Row"]> & {
          id: string;
          org_id: string;
          client_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_portal_users"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "client_portal_users_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      client_portal_invites: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          email: string;
          token: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_portal_invites"]["Row"]> & {
          org_id: string;
          client_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_portal_invites"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "client_portal_invites_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
