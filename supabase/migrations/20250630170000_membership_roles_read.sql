-- Permite que usuários leiam seus próprios papéis (necessário para getSessionContext)

CREATE POLICY membership_roles_read ON membership_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.id = membership_roles.membership_id
        AND om.user_id = auth.uid()
    )
  );
