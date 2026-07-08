import { describe, expect, it } from "vitest";
import { filterActiveLearningTree } from "@/modules/learning/domain/active-content";

describe("filterActiveLearningTree", () => {
  it("remove módulos, aulas e conteúdos inativos", () => {
    const result = filterActiveLearningTree([
      {
        id: "m1",
        title: "Ativo",
        sort_order: 0,
        is_active: true,
        lessons: [
          {
            id: "l1",
            title: "Aula ativa",
            sort_order: 0,
            lesson_contents: [{ id: "c1", is_active: true }],
          },
          {
            id: "l2",
            title: "Aula inativa",
            sort_order: 1,
            is_active: false,
            lesson_contents: [{ id: "c2", is_active: true }],
          },
        ],
      },
      {
        id: "m2",
        title: "Inativo",
        sort_order: 1,
        is_active: false,
        lessons: [],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.lessons).toHaveLength(1);
    expect(result[0]?.lessons[0]?.id).toBe("l1");
  });
});
