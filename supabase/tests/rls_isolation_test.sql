-- Testes de isolamento RLS — executar com: supabase test db
-- ou após supabase db reset em ambiente local de testes

BEGIN;

SELECT plan(8);

-- Fixtures: tenants e usuários simulados via set_config não funcionam com auth.uid()
-- Estes testes validam constraints e funções auxiliares.
-- Testes completos de RLS requerem JWT de teste via supabase auth helpers.

SELECT has_function('public', 'is_member_of_tenant', ARRAY['uuid'], 'função is_member_of_tenant existe');
SELECT has_function('public', 'has_permission', ARRAY['text'], 'função has_permission existe');
SELECT has_function('public', 'user_can_view_course', ARRAY['uuid'], 'função user_can_view_course existe');

SELECT col_is_pk('public', 'organization_memberships', ARRAY['id'], 'memberships possui PK');
SELECT col_is_pk('public', 'courses', ARRAY['id'], 'courses possui PK');

SELECT indexes_are(
  'public', 'course_enrollments',
  ARRAY[
    'course_enrollments_pkey',
    'course_enrollments_tenant_id_user_id_course_id_course_version_id_key',
    'idx_enrollments_user',
    'idx_enrollments_course'
  ],
  'índices esperados em course_enrollments'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'courses' AND policyname = 'courses_read'
  ),
  'policy courses_read existe'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'course_enrollments' AND policyname = 'enrollments_own'
  ),
  'policy enrollments_own existe'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_membership_created_assign_student'
  ),
  'trigger de papel aluno existe'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_course_versions_one_published'
  ),
  'índice de versão publicada única existe'
);

SELECT * FROM finish();

ROLLBACK;
