import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

export const courseGeneralSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  shortDescription: z.string().max(200).optional(),
  categoryId: z.string().uuid("Selecione uma categoria"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  workloadMinutes: z.coerce.number().int().positive("Carga horária inválida"),
  objectives: z.string().optional(),
  targetAudience: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

export const assignmentSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
  mandatory: z.boolean().default(true),
  dueAt: z.string().datetime().optional(),
  reason: z.string().optional(),
});

export const progressUpdateSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  contentId: z.string().uuid().optional(),
  videoPositionSeconds: z.number().int().min(0).optional(),
  videoPercent: z.number().min(0).max(100).optional(),
  markComplete: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CourseGeneralInput = z.infer<typeof courseGeneralSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
