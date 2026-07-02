"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CoverUpload({
  courseId,
  currentCoverUrl,
}: {
  courseId: string;
  currentCoverUrl: string | null;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contentType", "cover");
    formData.append("entityId", courseId);

    const res = await fetch("/api/learning/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Falha no upload.");
      return;
    }

    await fetch("/api/learning/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, path: data.path, bucket: data.bucket }),
    });
    router.refresh();
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Imagem de capa</label>
      {currentCoverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentCoverUrl} alt="" className="mb-2 h-32 w-auto rounded-lg object-cover" />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={uploading}
        aria-label="Upload da capa"
      />
      {uploading && <p className="mt-1 text-sm text-[var(--muted)]">Enviando...</p>}
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
