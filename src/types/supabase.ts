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
      access_group_permission_audit: {
        Row: {
          changed_by: string | null
          created_at: string
          group_id: string
          id: string
          new_value: boolean
          permission_id: string
          previous_value: boolean | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          group_id: string
          id?: string
          new_value: boolean
          permission_id: string
          previous_value?: boolean | null
          reason?: string | null
          tenant_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          group_id?: string
          id?: string
          new_value?: boolean
          permission_id?: string
          previous_value?: boolean | null
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_group_permission_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_group_permission_audit_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_group_permission_audit_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_group_permission_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      access_group_permissions: {
        Row: {
          created_at: string
          granted: boolean
          group_id: string
          id: string
          permission_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          group_id: string
          id?: string
          permission_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          group_id?: string
          id?: string
          permission_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_group_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      access_groups: {
        Row: {
          code: string
          created_at: string
          description: string | null
          fixture_key: string | null
          id: string
          is_system: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_system?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_system?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          checksum_sha256: string | null
          city_snapshot: string | null
          course_id: string | null
          course_title_snapshot: string | null
          course_version_id: string | null
          enrollment_id: string | null
          expires_at: string | null
          file_bucket: string | null
          file_path: string | null
          file_url: string | null
          final_score_snapshot: number | null
          id: string
          institution_snapshot: string | null
          instructor_name_snapshot: string | null
          instructor_role_snapshot: string | null
          instructor_signature_snapshot: string | null
          instructor_user_id: string | null
          is_demo: boolean
          issued_at: string
          learning_path_id: string | null
          qr_code_url: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_name_snapshot: string | null
          template_id: string | null
          tenant_id: string
          user_id: string
          validation_code: string
          workload_hours_snapshot: number | null
        }
        Insert: {
          checksum_sha256?: string | null
          city_snapshot?: string | null
          course_id?: string | null
          course_title_snapshot?: string | null
          course_version_id?: string | null
          enrollment_id?: string | null
          expires_at?: string | null
          file_bucket?: string | null
          file_path?: string | null
          file_url?: string | null
          final_score_snapshot?: number | null
          id?: string
          institution_snapshot?: string | null
          instructor_name_snapshot?: string | null
          instructor_role_snapshot?: string | null
          instructor_signature_snapshot?: string | null
          instructor_user_id?: string | null
          is_demo?: boolean
          issued_at?: string
          learning_path_id?: string | null
          qr_code_url?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          student_name_snapshot?: string | null
          template_id?: string | null
          tenant_id: string
          user_id: string
          validation_code: string
          workload_hours_snapshot?: number | null
        }
        Update: {
          checksum_sha256?: string | null
          city_snapshot?: string | null
          course_id?: string | null
          course_title_snapshot?: string | null
          course_version_id?: string | null
          enrollment_id?: string | null
          expires_at?: string | null
          file_bucket?: string | null
          file_path?: string | null
          file_url?: string | null
          final_score_snapshot?: number | null
          id?: string
          institution_snapshot?: string | null
          instructor_name_snapshot?: string | null
          instructor_role_snapshot?: string | null
          instructor_signature_snapshot?: string | null
          instructor_user_id?: string | null
          is_demo?: boolean
          issued_at?: string
          learning_path_id?: string | null
          qr_code_url?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          student_name_snapshot?: string | null
          template_id?: string | null
          tenant_id?: string
          user_id?: string
          validation_code?: string
          workload_hours_snapshot?: number | null
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
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_instructor_user_id_fkey"
            columns: ["instructor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "certificates_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          published_by: string | null
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
          published_by?: string | null
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
          published_by?: string | null
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
            foreignKeyName: "course_versions_published_by_fkey"
            columns: ["published_by"]
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
          fixture_key: string | null
          id: string
          is_global: boolean
          is_test_data: boolean
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
          fixture_key?: string | null
          id?: string
          is_global?: boolean
          is_test_data?: boolean
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
          fixture_key?: string | null
          id?: string
          is_global?: boolean
          is_test_data?: boolean
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
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          fixture_key: string | null
          id: string
          is_test_data: boolean
          opportunity_id: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["crm_activity_status"]
          subject: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opportunity_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"]
          subject: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opportunity_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"]
          subject?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          document: string | null
          fixture_key: string | null
          id: string
          is_test_data: boolean
          legal_name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          segment: string | null
          size: string | null
          status: string
          tenant_id: string
          trade_name: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          legal_name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          segment?: string | null
          size?: string | null
          status?: string
          tenant_id: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          legal_name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          segment?: string | null
          size?: string | null
          status?: string
          tenant_id?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          fixture_key: string | null
          full_name: string
          id: string
          is_test_data: boolean
          job_title: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          source: string | null
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fixture_key?: string | null
          full_name: string
          id?: string
          is_test_data?: boolean
          job_title?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fixture_key?: string | null
          full_name?: string
          id?: string
          is_test_data?: boolean
          job_title?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_id: string
          id: string
          tenant_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_id: string
          id?: string
          tenant_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "crm_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_custom_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_fields: {
        Row: {
          code: string
          created_at: string
          entity_type: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          label: string
          module: string
          options: Json
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          entity_type: string
          field_type: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label: string
          module: string
          options?: Json
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label?: string
          module?: string
          options?: Json
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_entity_tags: {
        Row: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          tag_id: string
          tenant_id: string
        }
        Insert: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          tag_id: string
          tenant_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["crm_entity_type"]
          tag_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_entity_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          id: string
          tenant_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          id?: string
          tenant_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["crm_entity_type"]
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          amount: number
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expected_close_date: string | null
          fixture_key: string | null
          id: string
          is_test_data: boolean
          lost_at: string | null
          lost_reason: string | null
          owner_id: string | null
          pipeline_id: string
          priority: Database["public"]["Enums"]["crm_priority"]
          probability: number
          source: string | null
          stage_entered_at: string
          stage_id: string
          status: Database["public"]["Enums"]["crm_opportunity_status"]
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
          won_at: string | null
        }
        Insert: {
          amount?: number
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          lost_at?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          pipeline_id: string
          priority?: Database["public"]["Enums"]["crm_priority"]
          probability?: number
          source?: string | null
          stage_entered_at?: string
          stage_id: string
          status?: Database["public"]["Enums"]["crm_opportunity_status"]
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          won_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          lost_at?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          pipeline_id?: string
          priority?: Database["public"]["Enums"]["crm_priority"]
          probability?: number
          source?: string | null
          stage_entered_at?: string
          stage_id?: string
          status?: Database["public"]["Enums"]["crm_opportunity_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunity_history: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          from_stage_id: string | null
          id: string
          metadata: Json
          opportunity_id: string
          tenant_id: string
          to_stage_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json
          opportunity_id: string
          tenant_id: string
          to_stage_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json
          opportunity_id?: string
          tenant_id?: string
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunity_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          created_by: string | null
          fixture_key: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_test_data: boolean
          name: string
          slug: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_test_data?: boolean
          name: string
          slug: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_test_data?: boolean
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipelines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          pipeline_id: string
          probability: number
          slug: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          pipeline_id: string
          probability?: number
          slug: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          pipeline_id?: string
          probability?: number
          slug?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          fixture_key: string | null
          id: string
          is_test_data: boolean
          opportunity_id: string | null
          owner_id: string | null
          priority: Database["public"]["Enums"]["crm_priority"]
          status: Database["public"]["Enums"]["crm_task_status"]
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opportunity_id?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["crm_priority"]
          status?: Database["public"]["Enums"]["crm_task_status"]
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opportunity_id?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["crm_priority"]
          status?: Database["public"]["Enums"]["crm_task_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      gamification_achievements: {
        Row: {
          campaign_id: string | null
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          points_reward: number
          settings: Json
          tenant_id: string
          title: string
        }
        Insert: {
          campaign_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          settings?: Json
          tenant_id: string
          title: string
        }
        Update: {
          campaign_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          settings?: Json
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_achievements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_campaign_participants: {
        Row: {
          campaign_id: string
          id: string
          is_active: boolean
          joined_at: string
          team_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          team_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          team_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaign_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaign_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_campaign_rules: {
        Row: {
          campaign_id: string
          created_at: string
          event_source: Database["public"]["Enums"]["gamification_event_source"]
          id: string
          is_active: boolean
          max_occurrences: number | null
          points: number
          settings: Json
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_source: Database["public"]["Enums"]["gamification_event_source"]
          id?: string
          is_active?: boolean
          max_occurrences?: number | null
          points: number
          settings?: Json
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_source?: Database["public"]["Enums"]["gamification_event_source"]
          id?: string
          is_active?: boolean
          max_occurrences?: number | null
          points?: number
          settings?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_campaign_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaign_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          fixture_key: string | null
          id: string
          name: string
          published_at: string | null
          published_by: string | null
          settings: Json
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["gamification_campaign_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          fixture_key?: string | null
          id?: string
          name: string
          published_at?: string | null
          published_by?: string | null
          settings?: Json
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["gamification_campaign_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          fixture_key?: string | null
          id?: string
          name?: string
          published_at?: string | null
          published_by?: string | null
          settings?: Json
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["gamification_campaign_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaigns_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_source: Database["public"]["Enums"]["gamification_event_source"]
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_source: Database["public"]["Enums"]["gamification_event_source"]
          id?: string
          idempotency_key: string
          occurred_at?: string
          payload?: Json
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_source?: Database["public"]["Enums"]["gamification_event_source"]
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payload?: Json
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_manual_adjustments: {
        Row: {
          campaign_id: string | null
          created_at: string
          created_by: string
          id: string
          ledger_id: string | null
          points_delta: number
          reason: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          ledger_id?: string | null
          points_delta: number
          reason: string
          tenant_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          ledger_id?: string | null
          points_delta?: number
          reason?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_manual_adjustments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_manual_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_manual_adjustments_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "gamification_points_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_manual_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_manual_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_mission_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          progress_value: number
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          progress_value?: number
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          progress_value?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "gamification_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_mission_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_mission_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_missions: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          settings: Json
          sort_order: number
          target_points: number | null
          tenant_id: string
          title: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          sort_order?: number
          target_points?: number | null
          tenant_id: string
          title: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          sort_order?: number
          target_points?: number | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_missions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_points_ledger: {
        Row: {
          balance_after: number | null
          campaign_id: string | null
          compensates_ledger_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          rule_id: string | null
          source: Database["public"]["Enums"]["gamification_event_source"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          campaign_id?: string | null
          compensates_ledger_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          rule_id?: string | null
          source: Database["public"]["Enums"]["gamification_event_source"]
          tenant_id: string
          user_id: string
        }
        Update: {
          balance_after?: number | null
          campaign_id?: string | null
          compensates_ledger_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          rule_id?: string | null
          source?: Database["public"]["Enums"]["gamification_event_source"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_points_ledger_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_compensates_ledger_id_fkey"
            columns: ["compensates_ledger_id"]
            isOneToOne: false
            referencedRelation: "gamification_points_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gamification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaign_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_rank_snapshots: {
        Row: {
          campaign_id: string
          created_by: string | null
          id: string
          rankings: Json
          snapshot_at: string
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          created_by?: string | null
          id?: string
          rankings: Json
          snapshot_at?: string
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          created_by?: string | null
          id?: string
          rankings?: Json
          snapshot_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_rank_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_rank_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_rank_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_rewards: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points_cost: number
          quantity: number | null
          settings: Json
          tenant_id: string
          title: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_cost?: number
          quantity?: number | null
          settings?: Json
          tenant_id: string
          title: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_cost?: number
          quantity?: number | null
          settings?: Json
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_rewards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_user_achievements: {
        Row: {
          achievement_id: string
          id: string
          tenant_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          tenant_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          tenant_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "gamification_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_user_achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      learning_assessment_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option_id: string | null
          tenant_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option_id?: string | null
          tenant_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_answers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessment_attempts: {
        Row: {
          assessment_id: string
          attempt_number: number
          correct_count: number
          created_at: string
          enrollment_id: string
          id: string
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          tenant_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          assessment_id: string
          attempt_number?: number
          correct_count?: number
          created_at?: string
          enrollment_id: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          tenant_id: string
          total_questions?: number
          user_id: string
        }
        Update: {
          assessment_id?: string
          attempt_number?: number
          correct_count?: number
          created_at?: string
          enrollment_id?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          tenant_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessment_options: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean
          label: string
          question_id: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          label: string
          question_id: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          label?: string
          question_id?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          prompt: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          prompt: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          prompt?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_questions_tenant_id_fkey"
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
      learning_media_assets: {
        Row: {
          bucket: string
          checksum_sha256: string | null
          created_at: string
          duration_seconds: number | null
          environment: string
          file_name: string
          fixture_key: string | null
          id: string
          import_metadata: Json
          import_source: string | null
          import_status: string
          is_demo: boolean
          is_test_data: boolean
          media_status: string
          mime_type: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bucket: string
          checksum_sha256?: string | null
          created_at?: string
          duration_seconds?: number | null
          environment?: string
          file_name: string
          fixture_key?: string | null
          id?: string
          import_metadata?: Json
          import_source?: string | null
          import_status?: string
          is_demo?: boolean
          is_test_data?: boolean
          media_status?: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bucket?: string
          checksum_sha256?: string | null
          created_at?: string
          duration_seconds?: number | null
          environment?: string
          file_name?: string
          fixture_key?: string | null
          id?: string
          import_metadata?: Json
          import_source?: string | null
          import_status?: string
          is_demo?: boolean
          is_test_data?: boolean
          media_status?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_media_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      learning_video_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          course_id: string
          created_at: string
          current_position_seconds: number
          duration_seconds: number
          enrollment_id: string
          id: string
          last_activity_at: string | null
          lesson_id: string
          media_asset_id: string | null
          started_at: string | null
          tenant_id: string
          updated_at: string
          user_id: string
          watch_percentage: number
          watched_seconds: number
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          course_id: string
          created_at?: string
          current_position_seconds?: number
          duration_seconds?: number
          enrollment_id: string
          id?: string
          last_activity_at?: string | null
          lesson_id: string
          media_asset_id?: string | null
          started_at?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
          watch_percentage?: number
          watched_seconds?: number
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          course_id?: string
          created_at?: string
          current_position_seconds?: number
          duration_seconds?: number
          enrollment_id?: string
          id?: string
          last_activity_at?: string | null
          lesson_id?: string
          media_asset_id?: string | null
          started_at?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          watch_percentage?: number
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_video_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "lesson_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "learning_media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_video_progress_user_id_fkey"
            columns: ["user_id"]
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
      membership_access_groups: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          group_id: string
          id: string
          membership_id: string
          tenant_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          group_id: string
          id?: string
          membership_id: string
          tenant_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          group_id?: string
          id?: string
          membership_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_access_groups_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_access_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_access_groups_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_access_groups_tenant_id_fkey"
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
      news_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          publication_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          publication_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          publication_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_attachments_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "news_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_publication_groups: {
        Row: {
          group_id: string
          publication_id: string
          tenant_id: string
        }
        Insert: {
          group_id: string
          publication_id: string
          tenant_id: string
        }
        Update: {
          group_id?: string
          publication_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_publication_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publication_groups_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "news_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publication_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_publication_teams: {
        Row: {
          publication_id: string
          team_id: string
          tenant_id: string
        }
        Insert: {
          publication_id: string
          team_id: string
          tenant_id: string
        }
        Update: {
          publication_id?: string
          team_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_publication_teams_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "news_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publication_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publication_teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_publications: {
        Row: {
          archived_at: string | null
          audience_type: Database["public"]["Enums"]["news_audience_type"]
          author_id: string
          category: Database["public"]["Enums"]["news_category"]
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          fixture_key: string | null
          id: string
          is_featured: boolean
          is_pinned: boolean
          is_test_data: boolean
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["news_publication_status"]
          summary: string
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          audience_type?: Database["public"]["Enums"]["news_audience_type"]
          author_id: string
          category?: Database["public"]["Enums"]["news_category"]
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          is_test_data?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["news_publication_status"]
          summary?: string
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          audience_type?: Database["public"]["Enums"]["news_audience_type"]
          author_id?: string
          category?: Database["public"]["Enums"]["news_category"]
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          is_test_data?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["news_publication_status"]
          summary?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_publications_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_publications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      one_on_one_action_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          fixture_key: string | null
          id: string
          is_test_data: boolean
          meeting_id: string | null
          origin: string | null
          owner_id: string
          priority: Database["public"]["Enums"]["crm_priority"]
          related_course_id: string | null
          related_indicator: string | null
          status: Database["public"]["Enums"]["one_on_one_action_status"]
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          meeting_id?: string | null
          origin?: string | null
          owner_id: string
          priority?: Database["public"]["Enums"]["crm_priority"]
          related_course_id?: string | null
          related_indicator?: string | null
          status?: Database["public"]["Enums"]["one_on_one_action_status"]
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          meeting_id?: string | null
          origin?: string | null
          owner_id?: string
          priority?: Database["public"]["Enums"]["crm_priority"]
          related_course_id?: string | null
          related_indicator?: string | null
          status?: Database["public"]["Enums"]["one_on_one_action_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_action_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_plans_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_plans_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_action_updates: {
        Row: {
          action_plan_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
          tenant_id: string
        }
        Insert: {
          action_plan_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          tenant_id: string
        }
        Update: {
          action_plan_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_action_updates_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_action_updates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_answers: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string
          question_id: string | null
          tenant_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id: string
          question_id?: string | null
          tenant_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string
          question_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_answers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_answers_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_template_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_answers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_indicators: {
        Row: {
          code: string
          created_at: string
          employee_id: string
          id: string
          label: string
          period_end: string | null
          period_start: string | null
          target_value: number | null
          tenant_id: string
          updated_at: string
          value: number | null
        }
        Insert: {
          code: string
          created_at?: string
          employee_id: string
          id?: string
          label: string
          period_end?: string | null
          period_start?: string | null
          target_value?: number | null
          tenant_id: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          employee_id?: string
          id?: string
          label?: string
          period_end?: string | null
          period_start?: string | null
          target_value?: number | null
          tenant_id?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_indicators_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_indicators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_meetings: {
        Row: {
          blockers: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          fixture_key: string | null
          id: string
          is_test_data: boolean
          manager_id: string
          positives: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["one_on_one_meeting_status"]
          summary: string | null
          template_id: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blockers?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          manager_id: string
          positives?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["one_on_one_meeting_status"]
          summary?: string | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blockers?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          manager_id?: string
          positives?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["one_on_one_meeting_status"]
          summary?: string | null
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_meetings_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_meetings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_meetings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          meeting_id: string | null
          tenant_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          meeting_id?: string | null
          tenant_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          meeting_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_template_questions: {
        Row: {
          id: string
          question: string
          section_id: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          id?: string
          question: string
          section_id: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          id?: string
          question?: string
          section_id?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_template_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_template_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_template_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_template_sections: {
        Row: {
          id: string
          sort_order: number
          template_id: string
          tenant_id: string
          title: string
        }
        Insert: {
          id?: string
          sort_order?: number
          template_id: string
          tenant_id: string
          title: string
        }
        Update: {
          id?: string
          sort_order?: number
          template_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "one_on_one_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_template_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fixture_key: string | null
          id: string
          is_active: boolean
          is_test_data: boolean
          name: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_test_data?: boolean
          name: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_test_data?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_templates_updated_by_fkey"
            columns: ["updated_by"]
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
          fixture_key: string | null
          id: string
          is_test_data: boolean
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          test_environment: string | null
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          test_environment?: string | null
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          test_environment?: string | null
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
          created_by_provisioner: boolean
          email: string
          fixture_key: string | null
          full_name: string | null
          id: string
          is_test_account: boolean
          job_title: string | null
          phone: string | null
          signature_storage_path: string | null
          status: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at: string | null
          test_environment: string | null
          test_expires_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by_provisioner?: boolean
          email: string
          fixture_key?: string | null
          full_name?: string | null
          id: string
          is_test_account?: boolean
          job_title?: string | null
          phone?: string | null
          signature_storage_path?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at?: string | null
          test_environment?: string | null
          test_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by_provisioner?: boolean
          email?: string
          fixture_key?: string | null
          full_name?: string | null
          id?: string
          is_test_account?: boolean
          job_title?: string | null
          phone?: string | null
          signature_storage_path?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          terms_accepted_at?: string | null
          test_environment?: string | null
          test_expires_at?: string | null
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
      support_categories: {
        Row: {
          created_at: string
          description: string | null
          fixture_key: string | null
          id: string
          is_active: boolean
          is_global: boolean
          name: string
          slug: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          name: string
          slug: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fixture_key?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          name?: string
          slug?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_knowledge_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean
          is_published: boolean
          slug: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_published?: boolean
          slug: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_published?: boolean
          slug?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_knowledge_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_knowledge_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_sla_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          priority: Database["public"]["Enums"]["support_priority"]
          resolution_hours: number
          response_hours: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          priority: Database["public"]["Enums"]["support_priority"]
          resolution_hours: number
          response_hours: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          resolution_hours?: number
          response_hours?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sla_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          tenant_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tenant_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_subcategories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          id: string
          message_id: string | null
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          id?: string
          message_id?: string | null
          tenant_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          id?: string
          message_id?: string | null
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_history: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          new_value: Json | null
          previous_value: Json | null
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          tenant_id: string
          ticket_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean
          tenant_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_ratings: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          id: string
          score: number
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          score: number
          tenant_id: string
          ticket_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          score?: number
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_ratings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_ratings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_ratings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          category_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          fixture_key: string | null
          id: string
          is_test_data: boolean
          opened_at: string
          priority: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at: string | null
          sla_due_at: string | null
          source: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subcategory_id: string | null
          team_id: string | null
          tenant_id: string
          ticket_number: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignee_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opened_at?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at?: string | null
          sla_due_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subcategory_id?: string | null
          team_id?: string | null
          tenant_id: string
          ticket_number?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignee_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          fixture_key?: string | null
          id?: string
          is_test_data?: boolean
          opened_at?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subcategory_id?: string | null
          team_id?: string | null
          tenant_id?: string
          ticket_number?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "support_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_updated_by_fkey"
            columns: ["updated_by"]
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
      calculate_course_score: {
        Args: { p_enrollment_id: string }
        Returns: number
      }
      create_course_draft_from_published: {
        Args: { p_course_id: string }
        Returns: string
      }
      evaluate_certificate_eligibility: {
        Args: { p_enrollment_id: string }
        Returns: Json
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
      user_can_view_news: {
        Args: {
          p_pub: Database["public"]["Tables"]["news_publications"]["Row"]
        }
        Returns: boolean
      }
      user_has_tenant_access: { Args: never; Returns: boolean }
      validate_public_certificate: { Args: { p_code: string }; Returns: Json }
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
      crm_activity_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "overdue"
      crm_activity_type:
        | "call"
        | "email"
        | "whatsapp"
        | "meeting"
        | "follow_up"
        | "task"
        | "note"
      crm_entity_type: "contact" | "company" | "opportunity"
      crm_opportunity_status: "open" | "won" | "lost"
      crm_priority: "low" | "medium" | "high" | "urgent"
      crm_task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "overdue"
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
      gamification_campaign_status: "draft" | "published" | "paused" | "closed"
      gamification_event_source:
        | "learning_lesson_completed"
        | "learning_assessment_passed"
        | "learning_course_completed"
        | "learning_certificate_issued"
        | "learning_path_completed"
        | "manual_adjustment"
        | "campaign_rule"
        | "mission_completed"
        | "achievement_unlocked"
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
      news_audience_type: "all" | "teams" | "groups"
      news_category:
        | "comunicado"
        | "resultado"
        | "reconhecimento"
        | "universidade"
        | "alerta"
      news_publication_status: "draft" | "scheduled" | "published" | "archived"
      one_on_one_action_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "cancelled"
      one_on_one_meeting_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      organization_status: "active" | "suspended" | "archived"
      progress_status: "not_started" | "in_progress" | "completed"
      support_priority: "low" | "medium" | "high" | "urgent"
      support_ticket_status:
        | "new"
        | "open"
        | "in_progress"
        | "waiting_requester"
        | "waiting_third_party"
        | "resolved"
        | "closed"
        | "cancelled"
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
      crm_activity_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "overdue",
      ],
      crm_activity_type: [
        "call",
        "email",
        "whatsapp",
        "meeting",
        "follow_up",
        "task",
        "note",
      ],
      crm_entity_type: ["contact", "company", "opportunity"],
      crm_opportunity_status: ["open", "won", "lost"],
      crm_priority: ["low", "medium", "high", "urgent"],
      crm_task_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "overdue",
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
      gamification_campaign_status: ["draft", "published", "paused", "closed"],
      gamification_event_source: [
        "learning_lesson_completed",
        "learning_assessment_passed",
        "learning_course_completed",
        "learning_certificate_issued",
        "learning_path_completed",
        "manual_adjustment",
        "campaign_rule",
        "mission_completed",
        "achievement_unlocked",
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
      news_audience_type: ["all", "teams", "groups"],
      news_category: [
        "comunicado",
        "resultado",
        "reconhecimento",
        "universidade",
        "alerta",
      ],
      news_publication_status: ["draft", "scheduled", "published", "archived"],
      one_on_one_action_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
      ],
      one_on_one_meeting_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      organization_status: ["active", "suspended", "archived"],
      progress_status: ["not_started", "in_progress", "completed"],
      support_priority: ["low", "medium", "high", "urgent"],
      support_ticket_status: [
        "new",
        "open",
        "in_progress",
        "waiting_requester",
        "waiting_third_party",
        "resolved",
        "closed",
        "cancelled",
      ],
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
