"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isGoogleDriveFolderUrl,
  normalizeLessonVideoUrl,
} from "@/modules/learning/domain/video-embed";
import {
  createModuleAction,
  createLessonAction,
  createContentAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteContentAction,
  reorderModulesAction,
  reorderLessonsAction,
  reorderContentsAction,
  updateModuleAction,
  updateLessonAction,
  updateContentAction,
  setModuleActiveAction,
  setLessonActiveAction,
} from "@/modules/learning/actions/structure-actions";

export type ContentBlock = {
  id: string;
  content_type: string;
  title: string;
  content: string | null;
  external_url: string | null;
  file_path: string | null;
  sort_order: number;
  is_active?: boolean;
};

export type LessonBlock = {
  id: string;
  title: string;
  sort_order: number;
  completion_rule: string;
  is_active?: boolean;
  lesson_contents: ContentBlock[];
};

export type ModuleBlock = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active?: boolean;
  lessons: LessonBlock[];
};

export function CourseContentBuilder({
  courseId,
  modules: initialModules,
}: {
  courseId: string;
  modules: ModuleBlock[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modules, setModules] = useState(initialModules);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleCreateModule() {
    if (!newModuleTitle.trim()) return;
    startTransition(async () => {
      const result = await createModuleAction(courseId, newModuleTitle.trim());
      if (result.error) setError(result.error);
      else {
        setNewModuleTitle("");
        setError(null);
        refresh();
      }
    });
  }

  function moveModule(index: number, direction: -1 | 1) {
    const next = [...modules];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setModules(next);
    startTransition(async () => {
      await reorderModulesAction(
        courseId,
        next.map((m) => m.id),
      );
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Nome do novo módulo"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          aria-label="Nome do módulo"
        />
        <Button type="button" onClick={handleCreateModule} disabled={pending}>
          <Plus className="h-4 w-4" /> Módulo
        </Button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum módulo criado. Comece adicionando o primeiro módulo.</p>
      ) : (
        modules.map((mod, modIndex) => (
          <ModuleEditor
            key={mod.id}
            courseId={courseId}
            module={mod}
            modIndex={modIndex}
            totalModules={modules.length}
            onMoveUp={() => moveModule(modIndex, -1)}
            onMoveDown={() => moveModule(modIndex, 1)}
            onRefresh={refresh}
            pending={pending}
          />
        ))
      )}
    </div>
  );
}

function ModuleEditor({
  courseId,
  module: mod,
  modIndex,
  totalModules,
  onMoveUp,
  onMoveDown,
  onRefresh,
  pending,
}: {
  courseId: string;
  module: ModuleBlock;
  modIndex: number;
  totalModules: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(mod.title);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [, startTransition] = useTransition();

  const lessons = [...mod.lessons].sort((a, b) => a.sort_order - b.sort_order);

  function saveTitle() {
    startTransition(async () => {
      await updateModuleAction(courseId, mod.id, { title });
      onRefresh();
    });
  }

  function addLesson() {
    if (!newLessonTitle.trim()) return;
    startTransition(async () => {
      await createLessonAction(courseId, mod.id, newLessonTitle.trim());
      setNewLessonTitle("");
      onRefresh();
    });
  }

  function removeModule() {
    if (!confirm("Excluir este módulo e todas as aulas?")) return;
    startTransition(async () => {
      await deleteModuleAction(courseId, mod.id);
      onRefresh();
    });
  }

  function toggleModuleActive() {
    const nextActive = mod.is_active === false;
    startTransition(async () => {
      await setModuleActiveAction(courseId, mod.id, nextActive);
      onRefresh();
    });
  }

  function moveLesson(lessonIndex: number, direction: -1 | 1) {
    const next = [...lessons];
    const target = lessonIndex + direction;
    if (target < 0 || target >= next.length) return;
    [next[lessonIndex], next[target]] = [next[target], next[lessonIndex]];
    startTransition(async () => {
      await reorderLessonsAction(courseId, mod.id, next.map((l) => l.id));
      onRefresh();
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)] p-4">
        <GripVertical className="h-4 w-4 text-[var(--foreground-muted)]" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-2 text-left font-medium"
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
          Módulo {modIndex + 1}: {mod.title}
          {mod.is_active === false && (
            <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">Inativo</span>
          )}
        </button>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={toggleModuleActive} disabled={pending}>
            {mod.is_active === false ? "Ativar" : "Desativar"}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={modIndex === 0 || pending} aria-label="Mover módulo para cima">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onMoveDown} disabled={modIndex >= totalModules - 1 || pending} aria-label="Mover módulo para baixo">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={removeModule} disabled={pending} aria-label="Excluir módulo">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 p-4">
          <div className="flex gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título do módulo" />
            <Button type="button" variant="secondary" onClick={saveTitle} disabled={pending}>
              Salvar
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nova aula"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              aria-label="Nome da aula"
            />
            <Button type="button" onClick={addLesson} disabled={pending}>
              <Plus className="h-4 w-4" /> Aula
            </Button>
          </div>

          {lessons.map((lesson, lessonIndex) => (
            <LessonEditor
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              lessonIndex={lessonIndex}
              totalLessons={lessons.length}
              onMoveUp={() => moveLesson(lessonIndex, -1)}
              onMoveDown={() => moveLesson(lessonIndex, 1)}
              onRefresh={onRefresh}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonEditor({
  courseId,
  lesson,
  lessonIndex,
  totalLessons,
  onMoveUp,
  onMoveDown,
  onRefresh,
  pending,
}: {
  courseId: string;
  lesson: LessonBlock;
  lessonIndex: number;
  totalLessons: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [, startTransition] = useTransition();
  const contents = [...lesson.lesson_contents].sort((a, b) => a.sort_order - b.sort_order);

  function saveLesson() {
    startTransition(async () => {
      await updateLessonAction(courseId, lesson.id, { title });
      onRefresh();
    });
  }

  function removeLesson() {
    if (!confirm("Excluir esta aula?")) return;
    startTransition(async () => {
      await deleteLessonAction(courseId, lesson.id);
      onRefresh();
    });
  }

  function toggleLessonActive() {
    const nextActive = lesson.is_active === false;
    startTransition(async () => {
      await setLessonActiveAction(courseId, lesson.id, nextActive);
      onRefresh();
    });
  }

  function addContent(type: string) {
    const defaultTitle =
      type === "text" ? "Texto" : type === "video" ? "Vídeo" : type === "link" ? "Link" : "Conteúdo";
    startTransition(async () => {
      await createContentAction(courseId, lesson.id, {
        content_type: type,
        title: defaultTitle,
      });
      onRefresh();
    });
  }

  function moveContent(contentIndex: number, direction: -1 | 1) {
    const next = [...contents];
    const target = contentIndex + direction;
    if (target < 0 || target >= next.length) return;
    [next[contentIndex], next[target]] = [next[target], next[contentIndex]];
    startTransition(async () => {
      await reorderContentsAction(courseId, lesson.id, next.map((c) => c.id));
      onRefresh();
    });
  }

  return (
    <div className="ml-4 rounded-lg border border-[var(--border-soft)] bg-[var(--card-elevated)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--foreground-secondary)]">
          Aula {lessonIndex + 1}
          {lesson.is_active === false && (
            <span className="ml-2 text-xs text-amber-300">(inativa)</span>
          )}
        </span>
        <Input
          className="max-w-xs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título da aula"
        />
        <Button type="button" size="sm" variant="secondary" onClick={saveLesson} disabled={pending}>
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onMoveUp} disabled={lessonIndex === 0} aria-label="Mover aula para cima">
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onMoveDown} disabled={lessonIndex >= totalLessons - 1} aria-label="Mover aula para baixo">
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={toggleLessonActive} disabled={pending}>
          {lesson.is_active === false ? "Ativar" : "Desativar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={removeLesson} aria-label="Excluir aula">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => addContent("text")} disabled={pending}>
          <FileText className="h-3 w-3" /> Texto
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addContent("video")} disabled={pending}>
          <Video className="h-3 w-3" /> Vídeo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addContent("link")} disabled={pending}>
          <LinkIcon className="h-3 w-3" /> Link
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addContent("pdf")} disabled={pending}>
          <FileText className="h-3 w-3" /> PDF
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addContent("image")} disabled={pending}>
          <ImageIcon className="h-3 w-3" /> Imagem
        </Button>
      </div>

      {contents.map((content, contentIndex) => (
        <ContentEditor
          key={content.id}
          courseId={courseId}
          content={content}
          contentIndex={contentIndex}
          totalContents={contents.length}
          onMoveUp={() => moveContent(contentIndex, -1)}
          onMoveDown={() => moveContent(contentIndex, 1)}
          onRefresh={onRefresh}
          pending={pending}
        />
      ))}
    </div>
  );
}

function ContentEditor({
  courseId,
  content,
  contentIndex,
  totalContents,
  onMoveUp,
  onMoveDown,
  onRefresh,
  pending,
}: {
  courseId: string;
  content: ContentBlock;
  contentIndex: number;
  totalContents: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.content ?? "");
  const [url, setUrl] = useState(content.external_url ?? "");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  function save() {
    if (content.content_type === "video" && url.trim() && isGoogleDriveFolderUrl(url)) {
      setUrlHint(
        "Use o link de cada vídeo individual (drive.google.com/file/d/.../view), não o link da pasta.",
      );
      return;
    }
    const normalizedUrl =
      content.content_type === "video" && url.trim()
        ? normalizeLessonVideoUrl(url)
        : url.trim() || content.external_url;

    startTransition(async () => {
      await updateContentAction(courseId, content.id, {
        title,
        content: content.content_type === "text" ? body : content.content,
        external_url: ["video", "link"].includes(content.content_type) ? normalizedUrl : content.external_url,
        ...(content.content_type === "video" && normalizedUrl
          ? { file_url: normalizedUrl, metadata: { provider: "google_drive" } }
          : {}),
      });
      setUrlHint(null);
      onRefresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteContentAction(courseId, content.id);
      onRefresh();
    });
  }

  async function handleUpload(file: File, kind: "cover" | "pdf" | "video" | "image") {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contentType", kind);
    formData.append("entityId", courseId);
    const res = await fetch("/api/learning/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.path) {
      await updateContentAction(courseId, content.id, {
        file_path: data.path,
        metadata: { bucket: data.bucket },
      });
      onRefresh();
    }
  }

  return (
    <div className="mb-2 rounded border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs uppercase text-[var(--foreground-muted)]">{content.content_type}</span>
        <Input className="h-8 flex-1 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="button" size="sm" variant="ghost" onClick={onMoveUp} disabled={contentIndex === 0} aria-label="Mover conteúdo para cima">
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onMoveDown} disabled={contentIndex >= totalContents - 1} aria-label="Mover conteúdo para baixo">
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={remove} aria-label="Excluir conteúdo">
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>

      {content.content_type === "text" && (
        <textarea
          className="field mb-2 w-full text-sm"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Conteúdo de texto"
        />
      )}

      {["video", "link"].includes(content.content_type) && (
        <>
          <Input
            className="mb-2"
            placeholder={
              content.content_type === "video"
                ? "URL do vídeo (ex.: https://drive.google.com/file/d/ID/view)"
                : "URL (https://...)"
            }
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlHint(null);
            }}
            aria-label="URL externa"
          />
          {content.content_type === "video" && (
            <p className="mb-2 text-xs text-[var(--foreground-muted)]">
              Para Google Drive, cole o link de cada vídeo individual. O sistema converte automaticamente para
              reprodução (/preview). Links de pasta não funcionam no player.
            </p>
          )}
          {urlHint && <p className="mb-2 text-xs text-red-400">{urlHint}</p>}
        </>
      )}

      {["pdf", "image", "video"].includes(content.content_type) && (
        <div className="mb-2">
          <input
            type="file"
            accept={content.content_type === "pdf" ? ".pdf" : content.content_type === "video" ? "video/*" : "image/*"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, content.content_type as "pdf" | "video" | "image");
            }}
            disabled={uploading || pending}
            aria-label="Enviar arquivo"
          />
          {content.file_path && (
            <p className="mt-1 text-xs text-[var(--muted)]">Arquivo: {content.file_path}</p>
          )}
        </div>
      )}

      <Button type="button" size="sm" onClick={save} disabled={pending || uploading}>
        Salvar bloco
      </Button>
    </div>
  );
}
