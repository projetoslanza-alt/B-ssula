import { describe, expect, it } from "vitest";
import { isExternalVideoUrl, toVideoEmbedUrl } from "@/modules/learning/domain/video-embed";

describe("isExternalVideoUrl", () => {
  it("aceita http/https", () => {
    expect(isExternalVideoUrl("https://drive.google.com/file/d/abc/preview")).toBe(true);
    expect(isExternalVideoUrl("http://example.com/v.mp4")).toBe(true);
  });

  it("rejeita nulos, paths e refs de storage", () => {
    expect(isExternalVideoUrl(null)).toBe(false);
    expect(isExternalVideoUrl(undefined)).toBe(false);
    expect(isExternalVideoUrl("tenant/bucket/file.mp4")).toBe(false);
    expect(isExternalVideoUrl("")).toBe(false);
  });
});

describe("toVideoEmbedUrl — Google Drive", () => {
  it("converte /file/d/<id>/view para /preview", () => {
    expect(
      toVideoEmbedUrl("https://drive.google.com/file/d/1A2B3C4D/view?usp=sharing"),
    ).toBe("https://drive.google.com/file/d/1A2B3C4D/preview");
  });

  it("mantém /preview já embutível", () => {
    expect(
      toVideoEmbedUrl("https://drive.google.com/file/d/1A2B3C4D/preview"),
    ).toBe("https://drive.google.com/file/d/1A2B3C4D/preview");
  });

  it("converte open?id= para /preview", () => {
    expect(
      toVideoEmbedUrl("https://drive.google.com/open?id=XYZ123"),
    ).toBe("https://drive.google.com/file/d/XYZ123/preview");
  });

  it("converte uc?id= para /preview", () => {
    expect(
      toVideoEmbedUrl("https://drive.google.com/uc?export=download&id=XYZ123"),
    ).toBe("https://drive.google.com/file/d/XYZ123/preview");
  });
});

describe("toVideoEmbedUrl — YouTube e Vimeo", () => {
  it("converte watch?v= para embed", () => {
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converte youtu.be para embed", () => {
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converte vimeo para player", () => {
    expect(toVideoEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });
});

describe("toVideoEmbedUrl — fallback e inválidos", () => {
  it("retorna a própria URL http quando provedor desconhecido", () => {
    expect(toVideoEmbedUrl("https://cdn.exemplo.com/v.mp4")).toBe(
      "https://cdn.exemplo.com/v.mp4",
    );
  });

  it("retorna null para valores não-http", () => {
    expect(toVideoEmbedUrl(null)).toBeNull();
    expect(toVideoEmbedUrl("tenant/bucket/file.mp4")).toBeNull();
  });
});
