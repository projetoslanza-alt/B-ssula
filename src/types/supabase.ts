/**
 * Gerado: npx supabase gen types typescript --local
 * NAO editar manualmente.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      assessments: {
        Row: {
          assessment_type: string
          course_version_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          settings: Json
          tenant_id: string | null
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          assessment_type: string
          course_version_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          settings?: Json
          tenant_id?: string | null
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          assessment_type?: string
          course_version_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          settings?: Json
          tenant_id?: string | null
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          affected_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json
          new_state: Json | null
          origin: string
          previous_state: Json | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          affected_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          new_state?: Json | null
          origin?: string
          previous_state?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          affected_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          new_state?: Json | null
          origin?: string
          previous_state?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string
          id: string
          is_global: boolean
          name: string
          template_config: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean
          name: string
          template_config?: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean
          name?: string
          template_config?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          course_id: string | null
          course_version_id: string | null
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string
          learning_path_id: string | null
          status: string
          template_id: string | null
          tenant_id: string
          user_id: string
          validation_code: string
        }
        Insert: {
          course_id?: string | null
          course_version_id?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          learning_path_id?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
          user_id: string
          validation_code: string
        }
        Update: {
          course_id?: string | null
          course_version_id?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          learning_path_id?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
          user_id?: string
          validation_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          accessed_at: string | null
          completed_at: string | null
          content_id: string
          enrollment_id: string
          id: string
          progress_percentage: number
          status: Database["public"]["Enums"]["progress_status"]
          tenant_id: string
          video_position_seconds: number
        }
        Insert: {
          accessed_at?: string | null
          completed_at?: string | null
          content_id: string
          enrollment_id: string
          id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["progress_status"]
          tenant_id: string
          video_position_seconds?: number
        }
        Update: {
          accessed_at?: string | null
          completed_at?: string | null
          content_id?: string
          enrollment_id?: string
          id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["progress_status"]
          tenant_id?: string
          video_position_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "lesson_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          assigned_by: string
          course_id: string | null
          course_version_id: string | null
          created_at: string
          due_at: string | null
          id: string
          learning_path_id: string | null
          mandatory: boolean
          priority: number
          reason: string | null
          status: string
          target_id: string | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          course_id?: string | null
          course_version_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          learning_path_id?: string | null
          mandatory?: boolean
          priority?: number
          reason?: string | null
          status?: string
          target_id?: string | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          course_id?: string | null
          course_version_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          learning_path_id?: string | null
          mandatory?: boolean
          priority?: number
          reason?: string | null
          status?: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["assignment_target_type"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          course_version_id: string
          created_at: string
          due_at: string | null
          enrollment_origin: Database["public"]["Enums"]["enrollment_origin"]
          id: string
          last_access_at: string | null
          last_content_id: string | null
          last_lesson_id: string | null
          mandatory: boolean
          progress_percentage: number
          started_at: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          tenant_id: string
          updated_at: string
          user_id: string
          waive_reason: string | null
          waived_at: string | null
          waived_by: string | null
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          course_version_id: string
          created_at?: string
          due_at?: string | null
          enrollment_origin?: Database["public"]["Enums"]["enrollment_origin"]
          id?: string
          last_access_at?: string | null
          last_content_id?: string | null
          last_lesson_id?: string | null
          mandatory?: boolean
          progress_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          course_version_id?: string
          created_at?: string
          due_at?: string | null
          enrollment_origin?: Database["public"]["Enums"]["enrollment_origin"]
          id?: string
          last_access_at?: string | null
          last_content_id?: string | null
          last_lesson_id?: string | null
          mandatory?: boolean
          progress_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_last_content_id_fkey"
            columns: ["last_content_id"]
            isOneToOne: false
            referencedRelation: "lesson_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_favorites: {
        Row: {
          course_id: string
          created_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          course_id: string
          instructor_id: string
          is_primary: boolean
        }
        Insert: {
          course_id: string
          instructor_id: string
          is_primary?: boolean
        }
        Update: {
          course_id?: string
          instructor_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_version_id: string
          created_at: string
          description: string | null
          id: string
          required: boolean
          sort_order: number
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_version_id: string
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_version_id?: string
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prerequisites: {
        Row: {
          course_id: string
          prerequisite_course_id: string
        }
        Insert: {
          course_id: string
          prerequisite_course_id: string
        }
        Update: {
          course_id?: string
          prerequisite_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          clarity_score: number | null
          comment: string | null
          content_score: number | null
          course_id: string
          created_at: string
          hidden_at: string | null
          id: string
          recommendation: boolean | null
          tenant_id: string
          usefulness: string | null
          user_id: string
        }
        Insert: {
          clarity_score?: number | null
          comment?: string | null
          content_score?: number | null
          course_id: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          recommendation?: boolean | null
          tenant_id: string
          usefulness?: string | null
          user_id: string
        }
        Update: {
          clarity_score?: number | null
          comment?: string | null
          content_score?: number | null
          course_id?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          recommendation?: boolean | null
          tenant_id?: string
          usefulness?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          course_id: string
          tag_id: string
        }
        Insert: {
          course_id: string
          tag_id: string
        }
        Update: {
          course_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tags_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          certificate_enabled: boolean
          certificate_validity_days: number | null
          completion_rules: Json
          course_id: string
          cover_bucket: string | null
          cover_path: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          format: string
          id: string
          instructor_id: string | null
          language: string
          level: Database["public"]["Enums"]["course_level"]
          objectives: string | null
          passing_score: number | null
          prerequisites: string | null
          published_at: string | null
          search_vector: unknown
          short_description: string | null
          status: Database["public"]["Enums"]["course_status"]
          target_audience: string | null
          tenant_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version_number: number
          visibility_type: string
          workload_minutes: number
        }
        Insert: {
          certificate_enabled?: boolean
          certificate_validity_days?: number | null
          completion_rules?: Json
          course_id: string
          cover_bucket?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          format?: string
          id?: string
          instructor_id?: string | null
          language?: string
          level?: Database["public"]["Enums"]["course_level"]
          objectives?: string | null
          passing_score?: number | null
          prerequisites?: string | null
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          target_audience?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version_number?: number
          visibility_type?: string
          workload_minutes?: number
        }
        Update: {
          certificate_enabled?: boolean
          certificate_validity_days?: number | null
          completion_rules?: Json
          course_id?: string
          cover_bucket?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          format?: string
          id?: string
          instructor_id?: string | null
          language?: string
          level?: Database["public"]["Enums"]["course_level"]
          objectives?: string | null
          passing_score?: number | null
          prerequisites?: string | null
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          target_audience?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version_number?: number
          visibility_type?: string
          workload_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_versions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_versions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_visibility_rules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rule_type: Database["public"]["Enums"]["visibility_rule_type"]
          target_id: string | null
          tenant_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rule_type: Database["public"]["Enums"]["visibility_rule_type"]
          target_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rule_type?: Database["public"]["Enums"]["visibility_rule_type"]
          target_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_visibility_rules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_visibility_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          id: string
          is_global: boolean
          slug: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          is_global?: boolean
          slug: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          is_global?: boolean
          slug?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          code: string
          created_at: string
          enabled: boolean
          id: string
          metadata: Json
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_action_links: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          source_entity_id: string
          source_entity_type: string
          source_module: string
          target_id: string
          target_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          source_entity_id: string
          source_entity_type: string
          source_module: string
          target_id: string
          target_type: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          source_entity_id?: string
          source_entity_type?: string
          source_module?: string
          target_id?: string
          target_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_action_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_global: boolean
          name: string
          slug: string
          sort_order: number
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_global?: boolean
          name: string
          slug: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_global?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          id: string
          learning_path_id: string
          required: boolean
          sort_order: number
          tenant_id: string | null
        }
        Insert: {
          course_id: string
          id?: string
          learning_path_id: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
        }
        Update: {
          course_id?: string
          id?: string
          learning_path_id?: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          archived_at: string | null
          category_id: string | null
          certificate_enabled: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_global: boolean
          sequential: boolean
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          target_audience: string | null
          tenant_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          workload_minutes: number
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          certificate_enabled?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean
          sequential?: boolean
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          target_audience?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          workload_minutes?: number
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          certificate_enabled?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean
          sequential?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          target_audience?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          workload_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_contents: {
        Row: {
          content: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          external_url: string | null
          file_path: string | null
          file_url: string | null
          id: string
          lesson_id: string
          metadata: Json
          required: boolean
          sort_order: number
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          external_url?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          lesson_id: string
          metadata?: Json
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          external_url?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          lesson_id?: string
          metadata?: Json
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_contents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          last_access_at: string | null
          lesson_id: string
          progress_percentage: number
          started_at: string | null
          status: Database["public"]["Enums"]["progress_status"]
          tenant_id: string
          time_spent_seconds: number
          video_position_seconds: number
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          last_access_at?: string | null
          lesson_id: string
          progress_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["progress_status"]
          tenant_id: string
          time_spent_seconds?: number
          video_position_seconds?: number
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          last_access_at?: string | null
          lesson_id?: string
          progress_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["progress_status"]
          tenant_id?: string
          time_spent_seconds?: number
          video_position_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          completion_config: Json
          completion_rule: Database["public"]["Enums"]["lesson_completion_rule"]
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          lesson_type: string
          module_id: string
          required: boolean
          sort_order: number
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completion_config?: Json
          completion_rule?: Database["public"]["Enums"]["lesson_completion_rule"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          lesson_type?: string
          module_id: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completion_config?: Json
          completion_rule?: Database["public"]["Enums"]["lesson_completion_rule"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          lesson_type?: string
          module_id?: string
          required?: boolean
          sort_order?: number
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          membership_id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          membership_id: string
          role_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          membership_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json
          read_at: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json
          read_at?: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json
          read_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          position_id: string | null
          role_ids: string[]
          team_id: string | null
          tenant_id: string
          token_hash: string
          unit_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          position_id?: string | null
          role_ids?: string[]
          team_id?: string | null
          tenant_id: string
          token_hash: string
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          position_id?: string | null
          role_ids?: string[]
          team_id?: string | null
          tenant_id?: string
          token_hash?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_primary: boolean
          joined_at: string | null
          position_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          team_id: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          joined_at?: string | null
          position_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          team_id?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          joined_at?: string | null
          position_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          team_id?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          default_locale: string
          id: string
          settings: Json
          tenant_id: string
          terms_required: boolean
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_locale?: string
          id?: string
          settings?: Json
          tenant_id: string
          terms_required?: boolean
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_locale?: string
          id?: string
          settings?: Json
          tenant_id?: string
          terms_required?: boolean
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name: string
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_global: boolean
          is_system: boolean
          name: string
          tenant_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          is_system?: boolean
          name: string
          tenant_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          is_system?: boolean
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          duration_seconds: number
          ended_at: string | null
          enrollment_id: string
          id: string
          is_active: boolean
          lesson_id: string | null
          started_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number
          ended_at?: string | null
          enrollment_id: string
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          started_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          duration_seconds?: number
          ended_at?: string | null
          enrollment_id?: string
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          started_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          slug: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          slug: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          slug?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_context: {
        Row: {
          active_tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_context_active_tenant_id_fkey"
            columns: ["active_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      auth_user_id: { Args: never; Returns: string }
      create_course_draft_from_published: {
        Args: { p_course_id: string }
        Returns: string
      }
      has_permission: { Args: { p_code: string }; Returns: boolean }
      is_member_of_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      publish_course_version: {
        Args: { p_course_id: string; p_version_id?: string }
        Returns: string
      }
      recalculate_enrollment_progress: {
        Args: { p_enrollment_id: string }
        Returns: number
      }
      update_overdue_enrollments: { Args: never; Returns: undefined }
      user_active_tenant_id: { Args: never; Returns: string }
      user_can_view_course: { Args: { p_course_id: string }; Returns: boolean }
    }
    Enums: {
      assignment_target_type:
        | "user"
        | "team"
        | "position"
        | "unit"
        | "organization"
        | "new_hire"
      content_type:
        | "text"
        | "video"
        | "audio"
        | "image"
        | "pdf"
        | "presentation"
        | "file"
        | "link"
        | "checklist"
        | "assessment"
        | "live"
        | "interactive"
      course_level: "beginner" | "intermediate" | "advanced" | "expert"
      course_status:
        | "draft"
        | "in_review"
        | "published"
        | "superseded"
        | "suspended"
        | "archived"
      enrollment_origin:
        | "voluntary"
        | "manager"
        | "action_plan"
        | "one_on_one"
        | "automation"
        | "position"
        | "team"
        | "onboarding"
        | "admin"
        | "recommendation"
      enrollment_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "overdue"
        | "waived"
        | "failed"
        | "expired"
      lesson_completion_rule:
        | "manual"
        | "text_read"
        | "video_percent"
        | "file_accessed"
        | "link_accessed"
        | "checklist"
        | "assessment"
        | "term_accepted"
      membership_status: "active" | "invited" | "suspended" | "removed"
      organization_status: "active" | "suspended" | "archived"
      progress_status: "not_started" | "in_progress" | "completed"
      visibility_rule_type:
        | "organization"
        | "position"
        | "team"
        | "unit"
        | "user"
        | "manager"
        | "director"
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
      assignment_target_type: [
        "user",
        "team",
        "position",
        "unit",
        "organization",
        "new_hire",
      ],
      content_type: [
        "text",
        "video",
        "audio",
        "image",
        "pdf",
        "presentation",
        "file",
        "link",
        "checklist",
        "assessment",
        "live",
        "interactive",
      ],
      course_level: ["beginner", "intermediate", "advanced", "expert"],
      course_status: [
        "draft",
        "in_review",
        "published",
        "superseded",
        "suspended",
        "archived",
      ],
      enrollment_origin: [
        "voluntary",
        "manager",
        "action_plan",
        "one_on_one",
        "automation",
        "position",
        "team",
        "onboarding",
        "admin",
        "recommendation",
      ],
      enrollment_status: [
        "not_started",
        "in_progress",
        "completed",
        "overdue",
        "waived",
        "failed",
        "expired",
      ],
      lesson_completion_rule: [
        "manual",
        "text_read",
        "video_percent",
        "file_accessed",
        "link_accessed",
        "checklist",
        "assessment",
        "term_accepted",
      ],
      membership_status: ["active", "invited", "suspended", "removed"],
      organization_status: ["active", "suspended", "archived"],
      progress_status: ["not_started", "in_progress", "completed"],
      visibility_rule_type: [
        "organization",
        "position",
        "team",
        "unit",
        "user",
        "manager",
        "director",
      ],
    },
  },
} as const

