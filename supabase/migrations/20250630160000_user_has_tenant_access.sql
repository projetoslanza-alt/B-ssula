-- Função para middleware: usuário autenticado com vínculo ativo e ao menos um papel
CREATE OR REPLACE FUNCTION user_has_tenant_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_roles mr ON mr.membership_id = om.id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION user_has_tenant_access() TO authenticated;
