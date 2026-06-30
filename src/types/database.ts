export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type DefaultTable<Row extends Record<string, unknown> = Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: DefaultTable<{ id: string; name: string; slug: string; status: string }>;
      organization_settings: DefaultTable<{ id: string; tenant_id: string }>;
      profiles: DefaultTable<{
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
        status: string;
      }>;
      units: DefaultTable<{ id: string; tenant_id: string; name: string; slug: string }>;
      teams: DefaultTable<{ id: string; tenant_id: string; name: string; slug: string; manager_id: string | null }>;
      positions: DefaultTable<{ id: string; tenant_id: string; name: string; slug: string }>;
      organization_memberships: DefaultTable<{
        id: string;
        tenant_id: string;
        user_id: string;
        unit_id: string | null;
        team_id: string | null;
        position_id: string | null;
        status: string;
      }>;
      user_organization_context: DefaultTable<{
        user_id: string;
        active_tenant_id: string;
      }>;
      roles: DefaultTable<{ id: string; code: string; name: string; is_global: boolean }>;
      permissions: DefaultTable<{ id: string; code: string; name: string; module: string }>;
      role_permissions: DefaultTable<{ role_id: string; permission_id: string }>;
      membership_roles: DefaultTable<{ membership_id: string; role_id: string }>;
      feature_flags: DefaultTable<{ id: string; code: string; enabled: boolean; tenant_id: string | null }>;
      organization_invites: DefaultTable<{ id: string; tenant_id: string; email: string }>;
      audit_events: DefaultTable<{
        id: string;
        tenant_id: string | null;
        actor_id: string | null;
        affected_user_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Json;
        origin: string;
      }>;
      notifications: DefaultTable<{
        id: string;
        tenant_id: string;
        user_id: string;
        type: string;
        title: string;
        message: string;
        link: string | null;
        read_at: string | null;
        created_at: string;
      }>;
      domain_events: DefaultTable<{ id: string; event_type: string; payload: Json }>;
      learning_categories: DefaultTable<{
        id: string;
        tenant_id: string | null;
        name: string;
        slug: string;
        description: string | null;
        is_global: boolean;
        is_active: boolean;
      }>;
      learning_paths: DefaultTable<{
        id: string;
        tenant_id: string | null;
        title: string;
        slug: string;
        status: string;
        is_global: boolean;
      }>;
      courses: DefaultTable<{
        id: string;
        tenant_id: string | null;
        category_id: string | null;
        slug: string;
        is_global: boolean;
        current_version_id: string | null;
        created_at: string;
        created_by: string | null;
      }>;
      course_versions: DefaultTable<{
        id: string;
        tenant_id: string | null;
        course_id: string;
        version_number: number;
        title: string;
        description: string | null;
        short_description: string | null;
        cover_url: string | null;
        objectives: string | null;
        target_audience: string | null;
        instructor_id: string | null;
        level: string;
        workload_minutes: number;
        status: string;
        certificate_enabled: boolean;
        published_at: string | null;
        search_vector: string | null;
      }>;
      learning_path_courses: DefaultTable<{ id: string; learning_path_id: string; course_id: string }>;
      course_modules: DefaultTable<{
        id: string;
        tenant_id: string | null;
        course_version_id: string;
        title: string;
        sort_order: number;
        lessons?: unknown;
      }>;
      lessons: DefaultTable<{
        id: string;
        tenant_id: string | null;
        module_id: string;
        title: string;
        sort_order: number;
        completion_rule: string;
        completion_config: Json;
        duration_minutes: number;
        lesson_contents?: unknown;
      }>;
      lesson_contents: DefaultTable<{
        id: string;
        tenant_id: string | null;
        lesson_id: string;
        content_type: string;
        title: string;
        content: string | null;
        file_url: string | null;
        external_url: string | null;
        sort_order: number;
      }>;
      course_enrollments: DefaultTable<{
        id: string;
        tenant_id: string;
        course_id: string;
        course_version_id: string;
        user_id: string;
        enrollment_origin: string;
        assigned_by: string | null;
        mandatory: boolean;
        due_at: string | null;
        status: string;
        progress_percentage: number;
        started_at: string | null;
        completed_at: string | null;
        last_access_at: string | null;
        last_lesson_id: string | null;
        last_content_id: string | null;
        courses?: unknown;
        course_versions?: unknown;
      }>;
      course_assignments: DefaultTable<{
        id: string;
        tenant_id: string;
        course_id: string | null;
        learning_path_id: string | null;
        target_type: string;
        target_id: string | null;
        mandatory: boolean;
        assigned_by: string;
        due_at: string | null;
        course_version_id: string | null;
      }>;
      lesson_progress: DefaultTable<{
        id: string;
        tenant_id: string;
        enrollment_id: string;
        lesson_id: string;
        status: string;
        progress_percentage: number;
        video_position_seconds: number;
      }>;
      content_progress: DefaultTable<{
        id: string;
        tenant_id: string;
        enrollment_id: string;
        content_id: string;
        status: string;
        progress_percentage: number;
        video_position_seconds: number;
      }>;
      study_sessions: DefaultTable<{ id: string; enrollment_id: string; user_id: string }>;
      course_favorites: DefaultTable<{ user_id: string; course_id: string; tenant_id: string }>;
      course_reviews: DefaultTable<{ id: string; course_id: string; user_id: string }>;
      assessments: DefaultTable<{ id: string; title: string }>;
      certificate_templates: DefaultTable<{ id: string; name: string }>;
      certificates: DefaultTable<{ id: string; validation_code: string; status: string }>;
      learning_action_links: DefaultTable<{ id: string; source_module: string }>;
      tags: DefaultTable<{ id: string; name: string; slug: string }>;
      course_tags: DefaultTable<{ course_id: string; tag_id: string }>;
      course_visibility_rules: DefaultTable<{ id: string; course_id: string; rule_type: string }>;
      course_instructors: DefaultTable<{ course_id: string; instructor_id: string }>;
      course_prerequisites: DefaultTable<{ course_id: string; prerequisite_course_id: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      recalculate_enrollment_progress: {
        Args: { p_enrollment_id: string };
        Returns: number;
      };
      has_permission: { Args: { p_code: string }; Returns: boolean };
      user_active_tenant_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
