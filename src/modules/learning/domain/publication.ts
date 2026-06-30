import { slugify } from "./progress";

export type PublishCheckItem = {
  id: string;
  label: string;
  passed: boolean;
  message?: string;
  href?: string;
};

export type PublishValidationResult = {
  canPublish: boolean;
  items: PublishCheckItem[];
};

export type CoursePublishInput = {
  courseId: string;
  version: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    categoryId: string | null;
    workloadMinutes: number;
    instructorId: string | null;
    visibilityType: string;
    status: string;
  };
  moduleCount: number;
  lessonCount: number;
  contentCount: number;
  requireCover: boolean;
  hasCover: boolean;
};

export function validateCourseForPublish(input: CoursePublishInput): PublishValidationResult {
  const basePath = `/universidade/admin/cursos/${input.courseId}`;
  const items: PublishCheckItem[] = [];

  items.push({
    id: "title",
    label: "Informações básicas — título",
    passed: input.version.title.trim().length >= 3,
    message: "Informe um título com pelo menos 3 caracteres.",
    href: `${basePath}/editar`,
  });

  items.push({
    id: "slug",
    label: "Informações básicas — slug",
    passed: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.version.slug),
    message: "Slug inválido.",
    href: `${basePath}/editar`,
  });

  items.push({
    id: "description",
    label: "Informações básicas — descrição",
    passed: Boolean(input.version.description && input.version.description.length >= 10),
    message: "Descrição deve ter pelo menos 10 caracteres.",
    href: `${basePath}/editar`,
  });

  items.push({
    id: "category",
    label: "Informações básicas — categoria",
    passed: Boolean(input.version.categoryId),
    message: "Selecione uma categoria.",
    href: `${basePath}/editar`,
  });

  items.push({
    id: "workload",
    label: "Informações básicas — carga horária",
    passed: input.version.workloadMinutes > 0,
    message: "Defina uma carga horária válida.",
    href: `${basePath}/editar`,
  });

  if (input.requireCover) {
    items.push({
      id: "cover",
      label: "Arquivos — capa",
      passed: input.hasCover,
      message: "Adicione uma imagem de capa.",
      href: `${basePath}/editar`,
    });
  }

  items.push({
    id: "modules",
    label: "Estrutura — módulos",
    passed: input.moduleCount >= 1,
    message: "Adicione pelo menos um módulo.",
    href: `${basePath}/conteudo`,
  });

  items.push({
    id: "lessons",
    label: "Estrutura — aulas",
    passed: input.lessonCount >= 1,
    message: "Adicione pelo menos uma aula.",
    href: `${basePath}/conteudo`,
  });

  items.push({
    id: "contents",
    label: "Conteúdos",
    passed: input.contentCount >= 1,
    message: "Adicione pelo menos um bloco de conteúdo.",
    href: `${basePath}/conteudo`,
  });

  items.push({
    id: "visibility",
    label: "Visibilidade",
    passed: Boolean(input.version.visibilityType),
    message: "Defina a visibilidade do curso.",
    href: `${basePath}/configuracoes`,
  });

  items.push({
    id: "instructor",
    label: "Autoria — instrutor",
    passed: Boolean(input.version.instructorId),
    message: "Defina um instrutor ou autor do curso.",
    href: `${basePath}/editar`,
  });

  items.push({
    id: "status",
    label: "Status",
    passed: input.version.status === "draft" || input.version.status === "in_review",
    message: "Somente rascunhos podem ser publicados.",
    href: `${basePath}/publicar`,
  });

  return {
    canPublish: items.every((i) => i.passed),
    items,
  };
}

export function isValidExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export { slugify };
