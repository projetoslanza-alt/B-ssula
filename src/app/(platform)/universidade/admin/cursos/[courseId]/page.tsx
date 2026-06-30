import { redirect } from "next/navigation";

export default async function CourseAdminIndexPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/universidade/admin/cursos/${courseId}/editar`);
}
