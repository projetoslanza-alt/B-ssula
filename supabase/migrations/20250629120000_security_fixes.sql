-- Correções de segurança, consistência multi-tenant e RBAC

-- search_path seguro em funções SECURITY DEFINER
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT auth.uid(); $$;

CREATE OR REPLACE FUNCTION user_active_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT active_tenant_id FROM user_organization_context WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_member_of_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION has_permission(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_roles mr ON mr.membership_id = om.id
    JOIN roles r ON r.id = mr.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.code = 'platform_admin'
  );
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION recalculate_enrollment_progress(p_enrollment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_percent NUMERIC;
  v_enrollment course_enrollments%ROWTYPE;
BEGIN
  SELECT * INTO v_enrollment FROM course_enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_enrollment.user_id IS DISTINCT FROM auth.uid()
     AND NOT has_permission('learning.team.read')
     AND NOT has_permission('learning.reports.read') THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM lessons l
  JOIN course_modules m ON m.id = l.module_id
  WHERE m.course_version_id = v_enrollment.course_version_id AND l.required = true;

  IF v_total = 0 THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO v_completed
  FROM lesson_progress lp
  JOIN lessons l ON l.id = lp.lesson_id
  WHERE lp.enrollment_id = p_enrollment_id
    AND lp.status = 'completed'
    AND l.required = true;

  v_percent := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100, 2);

  UPDATE course_enrollments SET
    progress_percentage = GREATEST(progress_percentage, v_percent),
    status = CASE
      WHEN v_percent >= 100 THEN 'completed'::enrollment_status
      WHEN v_percent > 0 THEN 'in_progress'::enrollment_status
      ELSE status
    END,
    completed_at = CASE WHEN v_percent >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_enrollment_id;

  RETURN v_percent;
END;
$$;

CREATE OR REPLACE FUNCTION update_overdue_enrollments()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE course_enrollments
  SET status = 'overdue', updated_at = now()
  WHERE mandatory = true
    AND due_at IS NOT NULL
    AND due_at < now()
    AND status IN ('not_started', 'in_progress');
END;
$$;

-- Atribuir papel Aluno automaticamente em novos vínculos
CREATE OR REPLACE FUNCTION assign_default_student_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_role_id UUID;
BEGIN
  SELECT id INTO v_student_role_id FROM roles WHERE code = 'student' AND is_global = true LIMIT 1;
  IF v_student_role_id IS NOT NULL THEN
    INSERT INTO membership_roles (membership_id, role_id)
    VALUES (NEW.id, v_student_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_membership_created_assign_student ON organization_memberships;
CREATE TRIGGER on_membership_created_assign_student
  AFTER INSERT ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION assign_default_student_role();

-- Consistência de tenant em módulos/aulas/conteúdos
CREATE OR REPLACE FUNCTION enforce_learning_tenant_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_expected_tenant UUID;
BEGIN
  IF TG_TABLE_NAME = 'course_modules' THEN
    SELECT cv.tenant_id INTO v_expected_tenant
    FROM course_versions cv WHERE cv.id = NEW.course_version_id;
    IF NEW.tenant_id IS NOT NULL AND v_expected_tenant IS NOT NULL AND NEW.tenant_id != v_expected_tenant THEN
      RAISE EXCEPTION 'tenant_id inconsistente no módulo';
    END IF;
    NEW.tenant_id := COALESCE(NEW.tenant_id, v_expected_tenant);
  ELSIF TG_TABLE_NAME = 'lessons' THEN
    SELECT cm.tenant_id INTO v_expected_tenant
    FROM course_modules cm WHERE cm.id = NEW.module_id;
    IF NEW.tenant_id IS NOT NULL AND v_expected_tenant IS NOT NULL AND NEW.tenant_id != v_expected_tenant THEN
      RAISE EXCEPTION 'tenant_id inconsistente na aula';
    END IF;
    NEW.tenant_id := COALESCE(NEW.tenant_id, v_expected_tenant);
  ELSIF TG_TABLE_NAME = 'lesson_contents' THEN
    SELECT l.tenant_id INTO v_expected_tenant
    FROM lessons l WHERE l.id = NEW.lesson_id;
    IF NEW.tenant_id IS NOT NULL AND v_expected_tenant IS NOT NULL AND NEW.tenant_id != v_expected_tenant THEN
      RAISE EXCEPTION 'tenant_id inconsistente no conteúdo';
    END IF;
    NEW.tenant_id := COALESCE(NEW.tenant_id, v_expected_tenant);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_modules_tenant_check ON course_modules;
CREATE TRIGGER course_modules_tenant_check
  BEFORE INSERT OR UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION enforce_learning_tenant_consistency();

DROP TRIGGER IF EXISTS lessons_tenant_check ON lessons;
CREATE TRIGGER lessons_tenant_check
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION enforce_learning_tenant_consistency();

DROP TRIGGER IF EXISTS lesson_contents_tenant_check ON lesson_contents;
CREATE TRIGGER lesson_contents_tenant_check
  BEFORE INSERT OR UPDATE ON lesson_contents
  FOR EACH ROW EXECUTE FUNCTION enforce_learning_tenant_consistency();

-- Impedir publicação duplicada de versão ativa
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_versions_one_published
  ON course_versions (course_id)
  WHERE status = 'published';

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_course_modules_version ON course_modules(course_version_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_contents_lesson ON lesson_contents(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_visibility_course ON course_visibility_rules(course_id);

-- Política: memberships insert apenas admin
DROP POLICY IF EXISTS memberships_manage ON organization_memberships;
CREATE POLICY memberships_manage ON organization_memberships FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND has_permission('platform.users.manage')
  );

-- Política insert em user_organization_context validada
DROP POLICY IF EXISTS context_own ON user_organization_context;
CREATE POLICY context_select_own ON user_organization_context FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY context_insert_own ON user_organization_context FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_member_of_tenant(active_tenant_id)
  );
CREATE POLICY context_update_own ON user_organization_context FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_member_of_tenant(active_tenant_id)
  );

-- Visibilidade: leitura de regras para membros do tenant
DROP POLICY IF EXISTS course_visibility_read ON course_visibility_rules;
CREATE POLICY course_visibility_read ON course_visibility_rules FOR SELECT
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS course_visibility_manage ON course_visibility_rules;
CREATE POLICY course_visibility_manage ON course_visibility_rules FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND has_permission('learning.course.create')
  );

ALTER TABLE course_visibility_rules ENABLE ROW LEVEL SECURITY;

-- Função: usuário pode ver curso (visibilidade + publicado)
CREATE OR REPLACE FUNCTION user_can_view_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course courses%ROWTYPE;
  v_version course_versions%ROWTYPE;
  v_membership organization_memberships%ROWTYPE;
  v_rule_count INTEGER;
  v_match_count INTEGER;
BEGIN
  SELECT * INTO v_course FROM courses WHERE id = p_course_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_course.is_global THEN
    SELECT * INTO v_version FROM course_versions
    WHERE course_id = p_course_id AND status = 'published'
    ORDER BY version_number DESC LIMIT 1;
    RETURN FOUND;
  END IF;

  IF NOT is_member_of_tenant(v_course.tenant_id) THEN RETURN false; END IF;

  SELECT * INTO v_version FROM course_versions
  WHERE course_id = p_course_id AND status = 'published'
  ORDER BY version_number DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_membership FROM organization_memberships
  WHERE user_id = auth.uid() AND tenant_id = v_course.tenant_id AND status = 'active';

  IF v_version.visibility_type = 'organization' THEN RETURN true; END IF;

  SELECT COUNT(*) INTO v_rule_count FROM course_visibility_rules WHERE course_id = p_course_id;
  IF v_rule_count = 0 THEN RETURN true; END IF;

  SELECT COUNT(*) INTO v_match_count FROM course_visibility_rules r
  WHERE r.course_id = p_course_id
    AND (
      (r.rule_type = 'organization')
      OR (r.rule_type = 'user' AND r.target_id = auth.uid())
      OR (r.rule_type = 'position' AND r.target_id = v_membership.position_id)
      OR (r.rule_type = 'team' AND r.target_id = v_membership.team_id)
      OR (r.rule_type = 'unit' AND r.target_id = v_membership.unit_id)
      OR (r.rule_type = 'manager' AND has_permission('learning.team.read'))
      OR (r.rule_type = 'director' AND has_permission('learning.reports.read_sensitive'))
    );

  RETURN v_match_count > 0;
END;
$$;
