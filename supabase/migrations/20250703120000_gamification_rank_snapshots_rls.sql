-- Políticas ausentes em tabelas de gamificação (rank_snapshots bloqueava leitura do pódio)

CREATE POLICY gamification_rank_snapshots_read ON gamification_rank_snapshots
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
  );

CREATE POLICY gamification_campaign_rules_read ON gamification_campaign_rules
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
  );

CREATE POLICY gamification_rewards_read ON gamification_rewards
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
  );

CREATE POLICY gamification_manual_adjustments_admin ON gamification_manual_adjustments
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND has_permission('gamification.points.adjust')
  );
