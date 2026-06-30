-- Reforça visibilidade restrita na leitura de cursos (usa user_can_view_course)
-- Administradores/instrutores com permissão de gestão veem todos os cursos do tenant

DROP POLICY IF EXISTS courses_read ON courses;
CREATE POLICY courses_read ON courses FOR SELECT
  USING (
    is_platform_admin()
    OR (is_global = true AND user_can_view_course(id))
    OR (
      tenant_id = user_active_tenant_id()
      AND is_member_of_tenant(tenant_id)
      AND (
        user_can_view_course(id)
        OR has_permission('learning.course.create')
        OR has_permission('learning.course.update_own')
      )
    )
  );
