-- RLS dos módulos CRM, One a One e Chamados

ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunity_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE one_on_one_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_action_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Macro para tabelas tenant-scoped com crm.view
CREATE POLICY crm_pipelines_tenant ON crm_pipelines FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.manage'));

CREATE POLICY crm_stages_tenant ON crm_stages FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.pipeline.manage'));

CREATE POLICY crm_companies_tenant ON crm_companies FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_contacts_tenant ON crm_contacts FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_opportunities_tenant ON crm_opportunities FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_activities_tenant ON crm_activities FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_tasks_tenant ON crm_tasks FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_notes_tenant ON crm_notes FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_tags_tenant ON crm_tags FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.manage'));

CREATE POLICY crm_entity_tags_tenant ON crm_entity_tags FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_custom_fields_tenant ON crm_custom_fields FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.manage'));

CREATE POLICY crm_custom_field_values_tenant ON crm_custom_field_values FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

CREATE POLICY crm_opportunity_history_tenant ON crm_opportunity_history FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('crm.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('crm.opportunity.edit'));

-- One a One
CREATE POLICY ooo_templates_tenant ON one_on_one_templates FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

CREATE POLICY ooo_sections_tenant ON one_on_one_template_sections FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

CREATE POLICY ooo_questions_tenant ON one_on_one_template_questions FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

CREATE POLICY ooo_meetings_tenant ON one_on_one_meetings FOR ALL
  USING (
    tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id)
    AND (
      has_permission('one_on_one.meeting.manage')
      OR manager_id = auth.uid() OR employee_id = auth.uid()
    )
  )
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.create'));

CREATE POLICY ooo_answers_tenant ON one_on_one_answers FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

CREATE POLICY ooo_action_plans_tenant ON one_on_one_action_plans FOR ALL
  USING (
    tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id)
    AND (has_permission('one_on_one.action_plan.manage') OR owner_id = auth.uid())
  )
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.action_plan.manage'));

CREATE POLICY ooo_action_updates_tenant ON one_on_one_action_updates FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.action_plan.manage'));

CREATE POLICY ooo_indicators_tenant ON one_on_one_indicators FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

CREATE POLICY ooo_notes_tenant ON one_on_one_notes FOR ALL
  USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id) AND has_permission('one_on_one.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('one_on_one.meeting.manage'));

-- Support
CREATE POLICY support_categories_read ON support_categories FOR SELECT
  USING (is_global OR tenant_id = user_active_tenant_id());

CREATE POLICY support_categories_manage ON support_categories FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'));

CREATE POLICY support_subcategories_tenant ON support_subcategories FOR ALL
  USING ((tenant_id = user_active_tenant_id() OR tenant_id IS NULL) AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'));

CREATE POLICY support_sla_tenant ON support_sla_policies FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'));

CREATE POLICY support_tickets_read ON support_tickets FOR SELECT
  USING (
    tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id)
    AND (
      has_permission('support.ticket.manage_all')
      OR requester_id = auth.uid()
      OR assignee_id = auth.uid()
    )
  );

CREATE POLICY support_tickets_write ON support_tickets FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('support.ticket.manage_all')
      OR (requester_id = auth.uid() AND has_permission('support.ticket.manage_own'))
    )
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('support.ticket.manage_all')
      OR has_permission('support.ticket.create')
    )
  );

CREATE POLICY support_messages_tenant ON support_ticket_messages FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.ticket.create'));

CREATE POLICY support_attachments_tenant ON support_ticket_attachments FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.ticket.create'));

CREATE POLICY support_history_tenant ON support_ticket_history FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.ticket.manage_all'));

CREATE POLICY support_ratings_tenant ON support_ticket_ratings FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.ticket.manage_own'));

CREATE POLICY support_kb_read ON support_knowledge_articles FOR SELECT
  USING (is_published AND (is_global OR tenant_id = user_active_tenant_id()));

CREATE POLICY support_kb_manage ON support_knowledge_articles FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.settings.manage'));
