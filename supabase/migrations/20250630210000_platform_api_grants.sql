-- Grants para tabelas dos módulos da Etapa 4

GRANT SELECT, INSERT, UPDATE, DELETE ON
  crm_pipelines, crm_stages, crm_companies, crm_contacts, crm_opportunities,
  crm_activities, crm_tasks, crm_notes, crm_tags, crm_entity_tags,
  crm_custom_fields, crm_custom_field_values, crm_opportunity_history,
  one_on_one_templates, one_on_one_template_sections, one_on_one_template_questions,
  one_on_one_meetings, one_on_one_answers, one_on_one_action_plans,
  one_on_one_action_updates, one_on_one_indicators, one_on_one_notes,
  support_categories, support_subcategories, support_sla_policies, support_tickets,
  support_ticket_messages, support_ticket_attachments, support_ticket_history,
  support_ticket_ratings, support_knowledge_articles
TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
