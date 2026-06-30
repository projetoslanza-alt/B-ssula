-- Etapa 3: versionamento de cursos, publicação transacional e reforços multi-tenant
-- Nota: 20250629120000_security_fixes.sql usa timestamp jun/2025 herdado da sequência inicial;
-- este arquivo (20250629130000) mantém ordenação cronológica sem renomear migrations já aplicadas.

ALTER TYPE course_status ADD VALUE IF NOT EXISTS 'superseded' AFTER 'published';

-- Capa: armazenar referência de storage (não URL assinada permanente)
ALTER TABLE course_versions
  ADD COLUMN IF NOT EXISTS cover_bucket TEXT,
  ADD COLUMN IF NOT EXISTS cover_path TEXT;

COMMENT ON COLUMN course_versions.cover_url IS 'Legado ou URL externa; preferir cover_bucket + cover_path';
COMMENT ON COLUMN course_versions.cover_bucket IS 'Bucket Supabase Storage da capa';
COMMENT ON COLUMN course_versions.cover_path IS 'Path no bucket da capa';

-- Impedir módulo apontando para versão de outro tenant (via trigger existente + CHECK indireto)
CREATE OR REPLACE FUNCTION enforce_module_version_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_version_tenant UUID;
BEGIN
  SELECT tenant_id INTO v_version_tenant
  FROM course_versions WHERE id = NEW.course_version_id;
  IF v_version_tenant IS NULL THEN
    RAISE EXCEPTION 'versão de curso inexistente';
  END IF;
  IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id != v_version_tenant THEN
    RAISE EXCEPTION 'módulo não pertence ao tenant da versão';
  END IF;
  NEW.tenant_id := v_version_tenant;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_modules_version_tenant ON course_modules;
CREATE TRIGGER course_modules_version_tenant
  BEFORE INSERT OR UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION enforce_module_version_tenant();

-- Progresso: enrollment não aceita percentual arbitrário do cliente
CREATE OR REPLACE FUNCTION protect_enrollment_progress_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.progress_percentage IS DISTINCT FROM OLD.progress_percentage
       AND NEW.progress_percentage > OLD.progress_percentage + 0.01
       AND current_setting('bussola.internal_progress', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'progress_percentage só pode ser atualizado pelo servidor';
    END IF;
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at
       AND NEW.status = 'completed'
       AND current_setting('bussola.internal_progress', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'conclusão só pode ser definida pelo servidor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_progress_protect ON course_enrollments;
CREATE TRIGGER enrollment_progress_protect
  BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION protect_enrollment_progress_fields();

-- recalculate com flag interna
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

  PERFORM set_config('bussola.internal_progress', 'true', true);
  UPDATE course_enrollments SET
    progress_percentage = v_percent,
    status = CASE
      WHEN v_percent >= 100 THEN 'completed'::enrollment_status
      WHEN v_percent > 0 THEN 'in_progress'::enrollment_status
      ELSE status
    END,
    completed_at = CASE WHEN v_percent >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_enrollment_id;
  PERFORM set_config('bussola.internal_progress', 'false', true);

  RETURN v_percent;
END;
$$;

-- Copia estrutura da versão publicada vigente para novo rascunho (idempotente)
CREATE OR REPLACE FUNCTION create_course_draft_from_published(p_course_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course courses%ROWTYPE;
  v_source course_versions%ROWTYPE;
  v_existing_draft UUID;
  v_new_version_id UUID;
  v_module RECORD;
  v_new_module_id UUID;
  v_lesson RECORD;
  v_new_lesson_id UUID;
  v_content RECORD;
BEGIN
  IF NOT has_permission('learning.course.create') THEN
    RAISE EXCEPTION 'sem permissão para editar curso';
  END IF;

  SELECT * INTO v_course FROM courses
  WHERE id = p_course_id AND tenant_id = user_active_tenant_id()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'curso não encontrado'; END IF;

  SELECT id INTO v_existing_draft FROM course_versions
  WHERE course_id = p_course_id AND status IN ('draft', 'in_review')
  ORDER BY version_number DESC LIMIT 1;

  IF v_existing_draft IS NOT NULL THEN
    RETURN v_existing_draft;
  END IF;

  SELECT * INTO v_source FROM course_versions
  WHERE id = v_course.current_version_id AND status = 'published';

  IF NOT FOUND THEN
    IF v_course.current_version_id IS NOT NULL THEN
      SELECT * INTO v_source FROM course_versions WHERE id = v_course.current_version_id;
      IF v_source.status IN ('draft', 'in_review') THEN
        RETURN v_source.id;
      END IF;
    END IF;
    RAISE EXCEPTION 'nenhuma versão publicada para copiar';
  END IF;

  INSERT INTO course_versions (
    tenant_id, course_id, version_number, title, description, short_description,
    cover_url, cover_bucket, cover_path, objectives, target_audience, prerequisites,
    instructor_id, level, workload_minutes, passing_score, certificate_enabled,
    certificate_validity_days, visibility_type, status, language, format, completion_rules,
    created_by
  )
  VALUES (
    v_source.tenant_id, p_course_id, v_source.version_number + 1,
    v_source.title, v_source.description, v_source.short_description,
    v_source.cover_url, v_source.cover_bucket, v_source.cover_path,
    v_source.objectives, v_source.target_audience, v_source.prerequisites,
    v_source.instructor_id, v_source.level, v_source.workload_minutes, v_source.passing_score,
    v_source.certificate_enabled, v_source.certificate_validity_days, v_source.visibility_type,
    'draft', v_source.language, v_source.format, v_source.completion_rules,
    auth.uid()
  )
  RETURNING id INTO v_new_version_id;

  FOR v_module IN
    SELECT * FROM course_modules WHERE course_version_id = v_source.id ORDER BY sort_order
  LOOP
    INSERT INTO course_modules (tenant_id, course_version_id, title, description, sort_order, required)
    VALUES (v_module.tenant_id, v_new_version_id, v_module.title, v_module.description, v_module.sort_order, v_module.required)
    RETURNING id INTO v_new_module_id;

    FOR v_lesson IN
      SELECT * FROM lessons WHERE module_id = v_module.id ORDER BY sort_order
    LOOP
      INSERT INTO lessons (
        tenant_id, module_id, title, description, lesson_type, duration_minutes,
        required, completion_rule, completion_config, sort_order
      )
      VALUES (
        v_lesson.tenant_id, v_new_module_id, v_lesson.title, v_lesson.description,
        v_lesson.lesson_type, v_lesson.duration_minutes, v_lesson.required,
        v_lesson.completion_rule, v_lesson.completion_config, v_lesson.sort_order
      )
      RETURNING id INTO v_new_lesson_id;

      FOR v_content IN
        SELECT * FROM lesson_contents WHERE lesson_id = v_lesson.id ORDER BY sort_order
      LOOP
        INSERT INTO lesson_contents (
          tenant_id, lesson_id, content_type, title, content, file_path, file_url,
          external_url, metadata, sort_order, required
        )
        VALUES (
          v_content.tenant_id, v_new_lesson_id, v_content.content_type, v_content.title,
          v_content.content, v_content.file_path, v_content.file_url, v_content.external_url,
          v_content.metadata, v_content.sort_order, v_content.required
        );
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_new_version_id;
END;
$$;

-- Publicação transacional com supersede da versão anterior
CREATE OR REPLACE FUNCTION publish_course_version(p_course_id UUID, p_version_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course courses%ROWTYPE;
  v_version_id UUID;
  v_version course_versions%ROWTYPE;
  v_old_published UUID;
  v_module_count INTEGER;
  v_lesson_count INTEGER;
BEGIN
  IF NOT has_permission('learning.course.publish') THEN
    RAISE EXCEPTION 'sem permissão para publicar';
  END IF;

  SELECT * INTO v_course FROM courses
  WHERE id = p_course_id AND tenant_id = user_active_tenant_id()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'curso não encontrado'; END IF;

  v_version_id := COALESCE(p_version_id, v_course.current_version_id);

  SELECT * INTO v_version FROM course_versions
  WHERE id = v_version_id AND course_id = p_course_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'versão não encontrada'; END IF;

  IF v_version.status NOT IN ('draft', 'in_review') THEN
    RAISE EXCEPTION 'apenas rascunhos podem ser publicados';
  END IF;

  SELECT COUNT(*) INTO v_module_count FROM course_modules WHERE course_version_id = v_version_id;
  IF v_module_count < 1 THEN RAISE EXCEPTION 'adicione pelo menos um módulo'; END IF;

  SELECT COUNT(*) INTO v_lesson_count
  FROM lessons l
  JOIN course_modules m ON m.id = l.module_id
  WHERE m.course_version_id = v_version_id;

  IF v_lesson_count < 1 THEN RAISE EXCEPTION 'adicione pelo menos uma aula'; END IF;

  SELECT id INTO v_old_published FROM course_versions
  WHERE course_id = p_course_id AND status = 'published' AND id != v_version_id
  LIMIT 1;

  IF v_old_published IS NOT NULL THEN
    UPDATE course_versions SET status = 'superseded', updated_at = now()
    WHERE id = v_old_published;
  END IF;

  UPDATE course_versions SET
    status = 'published',
    published_at = now(),
    updated_at = now()
  WHERE id = v_version_id;

  UPDATE courses SET current_version_id = v_version_id, updated_at = now()
  WHERE id = p_course_id;

  RETURN v_version_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_course_draft_from_published(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION publish_course_version(UUID, UUID) TO authenticated;
