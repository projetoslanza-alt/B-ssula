/**
 * Mapeamento FK para selects aninhados estilo PostgREST.
 * childTable: { foreignKey on child pointing to parent, cardinality }
 */
export type RelationDef = {
  foreignKey: string;
  cardinality: "many" | "one";
};

export const TABLE_RELATIONS: Record<string, Record<string, RelationDef>> = {
  support_categories: {
    support_subcategories: { foreignKey: "category_id", cardinality: "many" },
  },
  news_publications: {
    author: { foreignKey: "author_id", cardinality: "one" },
    news_publication_teams: { foreignKey: "publication_id", cardinality: "many" },
    news_publication_groups: { foreignKey: "publication_id", cardinality: "many" },
  },
  support_tickets: {
    profiles: { foreignKey: "requester_id", cardinality: "one" },
    requester: { foreignKey: "requester_id", cardinality: "one" },
    assignee: { foreignKey: "assignee_id", cardinality: "one" },
    support_categories: { foreignKey: "category_id", cardinality: "one" },
    teams: { foreignKey: "team_id", cardinality: "one" },
    support_kanban_columns: { foreignKey: "kanban_column_id", cardinality: "one" },
    support_subcategories: { foreignKey: "subcategory_id", cardinality: "one" },
    support_ticket_messages: { foreignKey: "ticket_id", cardinality: "many" },
    support_ticket_attachments: { foreignKey: "ticket_id", cardinality: "many" },
    support_ticket_history: { foreignKey: "ticket_id", cardinality: "many" },
  },
  support_ticket_messages: {
    author: { foreignKey: "created_by", cardinality: "one" },
    profiles: { foreignKey: "created_by", cardinality: "one" },
  },
  support_knowledge_articles: {
    support_categories: { foreignKey: "category_id", cardinality: "one" },
  },
  support_subcategories: {
    support_categories: { foreignKey: "category_id", cardinality: "one" },
  },
  organization_memberships: {
    profiles: { foreignKey: "user_id", cardinality: "one" },
    organizations: { foreignKey: "tenant_id", cardinality: "one" },
    access_groups: { foreignKey: "group_id", cardinality: "many" },
  },
  membership_access_groups: {
    access_groups: { foreignKey: "group_id", cardinality: "one" },
    organization_memberships: { foreignKey: "membership_id", cardinality: "one" },
  },
  membership_roles: {
    roles: { foreignKey: "role_id", cardinality: "one" },
  },
  access_groups: {
    access_group_permissions: { foreignKey: "group_id", cardinality: "many" },
  },
  access_group_permissions: {
    permissions: { foreignKey: "permission_id", cardinality: "one" },
  },
  role_permissions: {
    permissions: { foreignKey: "permission_id", cardinality: "one" },
  },
  courses: {
    course_versions: { foreignKey: "current_version_id", cardinality: "one" },
    learning_categories: { foreignKey: "category_id", cardinality: "one" },
  },
  course_versions: {
    courses: { foreignKey: "course_id", cardinality: "one" },
    course_modules: { foreignKey: "course_version_id", cardinality: "many" },
    assessments: { foreignKey: "course_version_id", cardinality: "many" },
  },
  course_enrollments: {
    courses: { foreignKey: "course_id", cardinality: "one" },
    course_versions: { foreignKey: "course_version_id", cardinality: "one" },
    profiles: { foreignKey: "user_id", cardinality: "one" },
  },
  learning_assessment_questions: {
    learning_assessment_options: { foreignKey: "question_id", cardinality: "many" },
  },
  learning_assessment_attempts: {
    profiles: { foreignKey: "user_id", cardinality: "one" },
    assessments: { foreignKey: "assessment_id", cardinality: "one" },
  },
  assessments: {
    course_versions: { foreignKey: "course_version_id", cardinality: "one" },
  },
  course_modules: {
    lessons: { foreignKey: "module_id", cardinality: "many" },
  },
  lessons: {
    lesson_contents: { foreignKey: "lesson_id", cardinality: "many" },
  },
  crm_opportunities: {
    crm_contacts: { foreignKey: "contact_id", cardinality: "one" },
    crm_companies: { foreignKey: "company_id", cardinality: "one" },
    crm_stages: { foreignKey: "stage_id", cardinality: "one" },
  },
  one_on_one_meetings: {
    one_on_one_meeting_blocks: { foreignKey: "meeting_id", cardinality: "many" },
    one_on_one_meeting_insights: { foreignKey: "meeting_id", cardinality: "many" },
    profiles: { foreignKey: "participant_id", cardinality: "one" },
  },
  gamification_campaigns: {
    gamification_campaign_participants: { foreignKey: "campaign_id", cardinality: "many" },
  },
  audit_events: {
    profiles: { foreignKey: "actor_id", cardinality: "one" },
  },
  gamification_missions: {
    gamification_campaigns: { foreignKey: "campaign_id", cardinality: "one" },
    gamification_mission_progress: { foreignKey: "mission_id", cardinality: "many" },
  },
};

/** Alias comum requester/assignee → profiles */
export function resolveRelationTable(parentTable: string, embedName: string): string {
  if (embedName === "requester" || embedName === "assignee" || embedName === "author") return "profiles";
  return embedName;
}

export function resolveForeignKey(
  parentTable: string,
  embedName: string,
  childTable: string,
): string {
  const rel = TABLE_RELATIONS[parentTable]?.[embedName];
  if (rel) return rel.foreignKey;

  // Heurística: child.tenant_id ou child.{parent_singular}_id
  if (childTable === "profiles" && (embedName === "requester" || embedName === "assignee" || embedName === "author")) {
    return `${embedName === "author" ? "author" : embedName}_id`;
  }
  const singular = parentTable.replace(/s$/, "");
  return `${singular}_id`;
}

export function relationCardinality(
  parentTable: string,
  embedName: string,
): "many" | "one" {
  return TABLE_RELATIONS[parentTable]?.[embedName]?.cardinality ?? "one";
}
