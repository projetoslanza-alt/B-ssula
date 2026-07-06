-- Migration local: 002_security_helpers.sql
-- Helpers de contexto/tenant para funções SQL (substituem auth.uid() do Supabase).
-- Autorização real no runtime local é feita na camada da aplicação.

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT NULL::uuid; $$;

CREATE OR REPLACE FUNCTION user_active_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT active_tenant_id FROM user_organization_context WHERE user_id = NULL::uuid;
$$;

CREATE OR REPLACE FUNCTION is_member_of_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE user_id = NULL::uuid
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
    WHERE om.user_id = NULL::uuid
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
    WHERE om.user_id = NULL::uuid
      AND om.status = 'active'
      AND r.code = 'platform_admin'
  );
$$;
