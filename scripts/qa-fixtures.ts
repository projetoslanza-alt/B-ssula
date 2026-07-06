/** Definições estáveis de fixtures QA — compartilhadas por provisionamento e testes. */

export const ROLE_IDS = {
  student: "00000000-0000-0000-0000-000000000001",
  manager: "00000000-0000-0000-0000-000000000002",
  instructor: "00000000-0000-0000-0000-000000000003",
  learning_admin: "00000000-0000-0000-0000-000000000004",
  director: "00000000-0000-0000-0000-000000000005",
  org_admin: "00000000-0000-0000-0000-000000000006",
  platform_admin: "00000000-0000-0000-0000-000000000007",
} as const;

export type RoleCode = keyof typeof ROLE_IDS;

export const LOCAL_PASSWORD = "Bussola@1234";

export const TENANTS = {
  north: {
    fixtureKey: "tenant.north",
    id: "11111111-1111-1111-1111-111111111111",
    name: "Empresa Norte",
    slug: "empresa-norte",
    teamId: "33333333-3333-3333-3333-333333333331",
    unitId: "22222222-2222-2222-2222-222222222221",
    categoryId: "55555555-5555-5555-5555-555555555553",
  },
  south: {
    fixtureKey: "tenant.south",
    id: "22222222-2222-2222-2222-222222222222",
    name: "Empresa Sul",
    slug: "empresa-sul",
    teamId: "33333333-3333-3333-3333-333333333332",
    unitId: "22222222-2222-2222-2222-222222222222",
    categoryId: "55555555-5555-5555-5555-555555555554",
  },
  productionQa: {
    fixtureKey: "tenant.production.qa",
    name: "QA Bússola Produção",
    slugPrefix: "qa-bussola-prod",
  },
} as const;

export type UserFixture = {
  fixtureKey: string;
  email: string;
  fullName: string;
  roles: RoleCode[];
  tenant: "north" | "south" | "global" | "multi";
  membershipStatus?: "active" | "suspended";
  skipDefaultStudentRole?: boolean;
  primaryTenant?: "north" | "south";
};

export const LOCAL_USERS: UserFixture[] = [
  {
    fixtureKey: "user.superadmin",
    email: "superadmin@bussola.local",
    fullName: "Super Admin Bússola",
    roles: ["platform_admin", "student"],
    tenant: "north",
    primaryTenant: "north",
  },
  {
    fixtureKey: "user.admin.north",
    email: "admin.norte@bussola.local",
    fullName: "Admin Norte",
    roles: ["org_admin", "student"],
    tenant: "north",
  },
  {
    fixtureKey: "user.director.north",
    email: "diretoria.norte@bussola.local",
    fullName: "Diretoria Norte",
    roles: ["director", "student"],
    tenant: "north",
  },
  {
    fixtureKey: "user.manager.north",
    email: "gestor.norte@bussola.local",
    fullName: "Gestor Norte",
    roles: ["manager", "student"],
    tenant: "north",
  },
  {
    fixtureKey: "user.instructor.north",
    email: "instrutor.norte@bussola.local",
    fullName: "Instrutor Norte",
    roles: ["instructor", "student"],
    tenant: "north",
  },
  {
    fixtureKey: "user.student.north",
    email: "aluno.norte@bussola.local",
    fullName: "Aluno Norte",
    roles: ["student"],
    tenant: "north",
  },
  {
    fixtureKey: "user.norole.north",
    email: "sempapel.norte@bussola.local",
    fullName: "Sem Papel Norte",
    roles: [],
    tenant: "north",
    skipDefaultStudentRole: true,
  },
  {
    fixtureKey: "user.inactive.north",
    email: "inativo.norte@bussola.local",
    fullName: "Inativo Norte",
    roles: ["student"],
    tenant: "north",
    membershipStatus: "suspended",
  },
  {
    fixtureKey: "user.admin.south",
    email: "admin.sul@bussola.local",
    fullName: "Admin Sul",
    roles: ["org_admin", "student"],
    tenant: "south",
  },
  {
    fixtureKey: "user.director.south",
    email: "diretoria.sul@bussola.local",
    fullName: "Diretoria Sul",
    roles: ["director", "student"],
    tenant: "south",
  },
  {
    fixtureKey: "user.manager.south",
    email: "gestor.sul@bussola.local",
    fullName: "Gestor Sul",
    roles: ["manager", "student"],
    tenant: "south",
  },
  {
    fixtureKey: "user.instructor.south",
    email: "instrutor.sul@bussola.local",
    fullName: "Instrutor Sul",
    roles: ["instructor", "student"],
    tenant: "south",
  },
  {
    fixtureKey: "user.student.south",
    email: "aluno.sul@bussola.local",
    fullName: "Aluno Sul",
    roles: ["student"],
    tenant: "south",
  },
  {
    fixtureKey: "user.norole.south",
    email: "sempapel.sul@bussola.local",
    fullName: "Sem Papel Sul",
    roles: [],
    tenant: "south",
    skipDefaultStudentRole: true,
  },
  {
    fixtureKey: "user.inactive.south",
    email: "inativo.sul@bussola.local",
    fullName: "Inativo Sul",
    roles: ["student"],
    tenant: "south",
    membershipStatus: "suspended",
  },
  {
    fixtureKey: "user.multi",
    email: "multiempresa@bussola.local",
    fullName: "Usuário Multiempresa",
    roles: ["manager", "student"],
    tenant: "multi",
    primaryTenant: "north",
  },
];

export type CourseFixture = {
  fixtureKey: string;
  tenant: "north" | "south" | "global";
  slug: string;
  title: string;
  status: "draft" | "published";
  visibility: "organization" | "restricted";
  restrictToUserFixture?: string;
  restrictToManager?: boolean;
  isGlobal?: boolean;
  withPrivateMaterial?: boolean;
  mandatoryForStudentFixture?: string;
  dueInDays?: number;
};

export const COURSE_FIXTURES: CourseFixture[] = [
  {
    fixtureKey: "north.course.published",
    tenant: "north",
    slug: "curso-norte-publicado",
    title: "Curso Norte — Publicado",
    status: "published",
    visibility: "organization",
  },
  {
    fixtureKey: "north.course.draft",
    tenant: "north",
    slug: "curso-norte-rascunho",
    title: "Curso Norte — Rascunho",
    status: "draft",
    visibility: "organization",
  },
  {
    fixtureKey: "north.course.restricted.student",
    tenant: "north",
    slug: "curso-norte-restrito-aluno",
    title: "Curso Norte — Restrito Aluno",
    status: "published",
    visibility: "restricted",
    restrictToUserFixture: "user.student.north",
  },
  {
    fixtureKey: "north.course.restricted.manager",
    tenant: "north",
    slug: "curso-norte-restrito-gestor",
    title: "Curso Norte — Restrito Gestor",
    status: "published",
    visibility: "restricted",
    restrictToManager: true,
  },
  {
    fixtureKey: "north.course.mandatory.ontrack",
    tenant: "north",
    slug: "curso-norte-obrigatorio-prazo",
    title: "Curso Norte — Obrigatório no prazo",
    status: "published",
    visibility: "organization",
    mandatoryForStudentFixture: "user.student.north",
    dueInDays: 14,
  },
  {
    fixtureKey: "north.course.mandatory.overdue",
    tenant: "north",
    slug: "curso-norte-obrigatorio-atrasado",
    title: "Curso Norte — Obrigatório atrasado",
    status: "published",
    visibility: "organization",
    mandatoryForStudentFixture: "user.student.north",
    dueInDays: -7,
  },
  {
    fixtureKey: "south.course.published",
    tenant: "south",
    slug: "curso-sul-publicado",
    title: "Curso Sul — Publicado",
    status: "published",
    visibility: "organization",
  },
  {
    fixtureKey: "south.course.draft",
    tenant: "south",
    slug: "curso-sul-rascunho",
    title: "Curso Sul — Rascunho",
    status: "draft",
    visibility: "organization",
  },
  {
    fixtureKey: "south.course.restricted.student",
    tenant: "south",
    slug: "curso-sul-restrito-aluno",
    title: "Curso Sul — Restrito Aluno",
    status: "published",
    visibility: "restricted",
    restrictToUserFixture: "user.student.south",
  },
  {
    fixtureKey: "south.course.restricted.manager",
    tenant: "south",
    slug: "curso-sul-restrito-gestor",
    title: "Curso Sul — Restrito Gestor",
    status: "published",
    visibility: "restricted",
    restrictToManager: true,
  },
  {
    fixtureKey: "south.course.mandatory.ontrack",
    tenant: "south",
    slug: "curso-sul-obrigatorio-prazo",
    title: "Curso Sul — Obrigatório no prazo",
    status: "published",
    visibility: "organization",
    mandatoryForStudentFixture: "user.student.south",
    dueInDays: 14,
  },
  {
    fixtureKey: "south.course.mandatory.overdue",
    tenant: "south",
    slug: "curso-sul-obrigatorio-atrasado",
    title: "Curso Sul — Obrigatório atrasado",
    status: "published",
    visibility: "organization",
    mandatoryForStudentFixture: "user.student.south",
    dueInDays: -7,
  },
  {
    fixtureKey: "south.course.private.material",
    tenant: "south",
    slug: "curso-sul-material-privado",
    title: "Curso Sul — Material Privado",
    status: "published",
    visibility: "organization",
    withPrivateMaterial: true,
  },
  {
    fixtureKey: "global.course.bussola",
    tenant: "global",
    slug: "curso-oficial-bussola",
    title: "Curso Oficial Bússola",
    status: "published",
    visibility: "organization",
    isGlobal: true,
  },
];

/** Mapeamento perfil conceitual → role existente */
export const PROFILE_ROLE_MATRIX = [
  { profile: "Administrador global Bússola", role: "platform_admin", scope: "Global" },
  { profile: "Administrador da organização", role: "org_admin", scope: "Tenant" },
  { profile: "Diretoria", role: "director", scope: "Tenant" },
  { profile: "Gestor", role: "manager", scope: "Tenant/equipe" },
  { profile: "Instrutor/produtor", role: "instructor", scope: "Tenant" },
  { profile: "Aluno", role: "student", scope: "Tenant" },
] as const;
