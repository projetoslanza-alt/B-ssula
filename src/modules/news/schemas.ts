import { z } from "zod";

const categorySchema = z.enum(["comunicado", "resultado", "reconhecimento", "universidade", "alerta"]);
const audienceSchema = z.enum(["all", "teams", "groups"]);
const actionSchema = z.enum(["draft", "publish", "schedule"]);

export const newsPublicationSchema = z.object({
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres").max(200),
  summary: z.string().max(500).optional().default(""),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  category: categorySchema,
  audienceType: audienceSchema.default("all"),
  teamIds: z.array(z.string().uuid()).optional().default([]),
  groupIds: z.array(z.string().uuid()).optional().default([]),
  isFeatured: z.coerce.boolean().optional().default(false),
  isPinned: z.coerce.boolean().optional().default(false),
  scheduledAt: z.string().optional().nullable(),
  action: actionSchema,
});

export type NewsPublicationInput = z.infer<typeof newsPublicationSchema>;
