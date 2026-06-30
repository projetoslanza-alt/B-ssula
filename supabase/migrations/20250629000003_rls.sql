-- Row Level Security — isolamento multi-tenant

-- Helpers
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_active_tenant_id()
RETURNS UUID AS $$
  SELECT active_tenant_id FROM user_organization_context WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_member_of_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(p_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_roles mr ON mr.membership_id = om.id
    JOIN role_permissions rp ON rp.role_id = mr.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE om.user_id = auth.uid()
      AND om.tenant_id = user_active_tenant_id()
      AND om.status = 'active'
      AND p.code = p_code
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_roles mr ON mr.membership_id = om.id
    JOIN roles r ON r.id = mr.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.code = 'platform_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_visibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_action_links ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() OR is_member_of_tenant(user_active_tenant_id()));

CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Organizations
CREATE POLICY orgs_select_member ON organizations FOR SELECT
  USING (is_member_of_tenant(id) OR is_platform_admin());

CREATE POLICY orgs_manage_admin ON organizations FOR ALL
  USING (has_permission('platform.organization.manage') OR is_platform_admin());

-- Memberships
CREATE POLICY memberships_select ON organization_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id))
  );

CREATE POLICY memberships_manage ON organization_memberships FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'));

-- User context
CREATE POLICY context_own ON user_organization_context FOR ALL
  USING (user_id = auth.uid());

-- Units, teams, positions
CREATE POLICY units_tenant ON units FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY teams_tenant ON teams FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY positions_tenant ON positions FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

-- Permissions (read all authenticated)
CREATE POLICY permissions_read ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_read ON roles FOR SELECT TO authenticated USING (is_global OR tenant_id = user_active_tenant_id());
CREATE POLICY role_permissions_read ON role_permissions FOR SELECT TO authenticated USING (true);

-- Notifications
CREATE POLICY notifications_own ON notifications FOR ALL
  USING (user_id = auth.uid() AND tenant_id = user_active_tenant_id());

-- Audit
CREATE POLICY audit_read ON audit_events FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND has_permission('platform.audit.read'));

CREATE POLICY audit_insert ON audit_events FOR INSERT
  WITH CHECK (tenant_id = user_active_tenant_id());

-- Learning: categorias
CREATE POLICY categories_read ON learning_categories FOR SELECT
  USING (
    (is_global = true AND is_active = true)
    OR (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id))
    OR is_platform_admin()
  );

CREATE POLICY categories_manage ON learning_categories FOR ALL
  USING (
    (tenant_id = user_active_tenant_id() AND has_permission('learning.category.manage'))
    OR (is_global = true AND is_platform_admin())
  );

-- Cursos publicados
CREATE POLICY courses_read ON courses FOR SELECT
  USING (
    (is_global = true)
    OR (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id))
    OR is_platform_admin()
  );

CREATE POLICY courses_manage ON courses FOR ALL
  USING (
    (tenant_id = user_active_tenant_id() AND (has_permission('learning.course.create') OR has_permission('learning.course.update_own')))
    OR (is_global = true AND has_permission('platform.global_content.manage'))
  );

CREATE POLICY course_versions_read ON course_versions FOR SELECT
  USING (
    status = 'published'
    OR (tenant_id = user_active_tenant_id() AND (has_permission('learning.course.create') OR has_permission('learning.course.update_own')))
    OR is_platform_admin()
  );

CREATE POLICY course_versions_manage ON course_versions FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND (has_permission('learning.course.create') OR has_permission('learning.course.update_own') OR has_permission('learning.course.publish'))
  );

-- Módulos, aulas, conteúdos (via tenant)
CREATE POLICY modules_read ON course_modules FOR SELECT
  USING (tenant_id = user_active_tenant_id() OR tenant_id IS NULL OR is_platform_admin());

CREATE POLICY modules_manage ON course_modules FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('learning.course.create'));

CREATE POLICY lessons_read ON lessons FOR SELECT
  USING (tenant_id = user_active_tenant_id() OR tenant_id IS NULL OR is_platform_admin());

CREATE POLICY lessons_manage ON lessons FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('learning.course.create'));

CREATE POLICY contents_read ON lesson_contents FOR SELECT
  USING (tenant_id = user_active_tenant_id() OR tenant_id IS NULL OR is_platform_admin());

CREATE POLICY contents_manage ON lesson_contents FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('learning.course.create'));

-- Enrollments
CREATE POLICY enrollments_own ON course_enrollments FOR SELECT
  USING (
    user_id = auth.uid()
    OR (tenant_id = user_active_tenant_id() AND has_permission('learning.team.read'))
    OR (tenant_id = user_active_tenant_id() AND has_permission('learning.reports.read'))
  );

CREATE POLICY enrollments_insert ON course_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid() AND tenant_id = user_active_tenant_id());

CREATE POLICY enrollments_update_own ON course_enrollments FOR UPDATE
  USING (user_id = auth.uid() AND tenant_id = user_active_tenant_id());

-- Progress
CREATE POLICY lesson_progress_own ON lesson_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY content_progress_own ON content_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()
    )
  );

-- Assignments
CREATE POLICY assignments_read ON course_assignments FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY assignments_manage ON course_assignments FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('learning.assignment.create'));

-- Favorites
CREATE POLICY favorites_own ON course_favorites FOR ALL
  USING (user_id = auth.uid() AND tenant_id = user_active_tenant_id());

-- Paths
CREATE POLICY paths_read ON learning_paths FOR SELECT
  USING (
    (is_global = true AND status = 'published')
    OR (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id))
  );

CREATE POLICY paths_manage ON learning_paths FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('learning.path.manage'));

-- Certificates
CREATE POLICY certificates_own ON certificates FOR SELECT
  USING (
    user_id = auth.uid()
    OR (tenant_id = user_active_tenant_id() AND has_permission('learning.reports.read'))
  );
