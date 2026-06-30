"use server";

import { revalidatePath } from "next/cache";
import { publishCourseAction } from "@/modules/learning/actions/course-actions";

export async function publishCourseFormAction(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  await publishCourseAction(courseId);
  revalidatePath("/universidade/admin/cursos");
}
