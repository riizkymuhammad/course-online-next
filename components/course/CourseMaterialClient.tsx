"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CourseMaterialModule = {
  id: string;
  title: string;
  description: string | null;
  contentMarkdown: string | null;
  learningObjectives: unknown;
  estimatedMinutes: number | null;
  moduleOrder: number;
};

export type CourseMaterialSection = {
  id: string;
  title: string;
  description: string | null;
  sectionOrder: number;
  modules: CourseMaterialModule[];
};

export default function CourseMaterialClient({
  courseId,
  courseTitle,
  sections,
  initialModuleId,
  completedModuleIds,
  isLoggedIn,
  materialBaseHref,
}: {
  courseId: string;
  courseTitle: string;
  sections: CourseMaterialSection[];
  initialModuleId: string;
  completedModuleIds: string[];
  isLoggedIn: boolean;
  materialBaseHref: string;
}) {
  const router = useRouter();
  const modules = useMemo(() => sections.flatMap((section) => section.modules), [sections]);
  const [activeModuleId, setActiveModuleId] = useState(initialModuleId || modules[0]?.id || "");
  const [completedIds, setCompletedIds] = useState(() => new Set(completedModuleIds));
  const [openSectionIds, setOpenSectionIds] = useState(() => {
    const activeSectionId = sections.find((section) =>
      section.modules.some((module) => module.id === initialModuleId)
    )?.id;
    return new Set(activeSectionId ? [activeSectionId] : sections[0] ? [sections[0].id] : []);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeModuleIndex = modules.findIndex((module) => module.id === activeModuleId);
  const activeModule = activeModuleIndex >= 0 ? modules[activeModuleIndex] : modules[0];
  const activeSection = sections.find((section) =>
    section.modules.some((module) => module.id === activeModule?.id)
  );
  const nextModule = activeModuleIndex >= 0 ? modules[activeModuleIndex + 1] : undefined;

  const saveProgress = useCallback(
    async (moduleId: string, action: "open" | "complete") => {
      const response = await fetch("/api/course/module-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, moduleId, action }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menyimpan progres pembelajaran.");
      }
    },
    [courseId]
  );

  useEffect(() => {
    if (!isLoggedIn || !activeModule) return;

    let isCurrent = true;
    void saveProgress(activeModule.id, "open").catch((error) => {
      if (isCurrent) {
        setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan progres pembelajaran.");
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [activeModule?.id, isLoggedIn, saveProgress]);

  function openModule(moduleId: string) {
    setActiveModuleId(moduleId);
    setErrorMessage(null);
    const targetSection = sections.find((section) =>
      section.modules.some((module) => module.id === moduleId)
    );
    if (targetSection) {
      setOpenSectionIds((current) => new Set([...current, targetSection.id]));
    }
    router.push(`${materialBaseHref}/${moduleId}`);
  }

  async function completeAndContinue() {
    if (!activeModule || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isLoggedIn && !completedIds.has(activeModule.id)) {
        await saveProgress(activeModule.id, "complete");
      }

      setCompletedIds((current) => new Set([...current, activeModule.id]));

      if (nextModule) {
        openModule(nextModule.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan progres modul.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSection(sectionId: string, isOpen: boolean) {
    setOpenSectionIds((current) => {
      const next = new Set(current);
      if (isOpen) next.add(sectionId);
      else next.delete(sectionId);
      return next;
    });
  }

  if (!activeModule || !activeSection) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="font-medium text-gray-800 dark:text-white/90">Materi belum tersedia</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Course ini belum memiliki modul untuk dipelajari.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7 lg:col-span-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          {courseTitle} · Section {activeSection.sectionOrder}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Modul {activeSection.sectionOrder}.{activeModule.moduleOrder}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {activeModule.title}
            </h1>
          </div>
          {activeModule.estimatedMinutes ? (
            <span className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              {activeModule.estimatedMinutes} menit
            </span>
          ) : null}
        </div>

        {activeModule.description ? (
          <p className="mt-5 border-l-4 border-brand-500 pl-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
            {activeModule.description}
          </p>
        ) : null}

        <LearningObjectives value={activeModule.learningObjectives} />
        <MarkdownContent value={activeModule.contentMarkdown} />

        {errorMessage ? (
          <p className="mt-7 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errorMessage}
          </p>
        ) : null}

        {!isLoggedIn ? (
          <p className="mt-7 text-sm text-gray-500 dark:text-gray-400">
            Progres modul akan tersimpan setelah Anda masuk.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={completeAndContinue}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving
              ? "Menyimpan progres..."
              : nextModule
                ? "Selesai & Lanjut"
                : "Selesai Course"}
          </button>
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-24 lg:col-span-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            ☷
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Struktur Course</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Section & Modul</h2>
          </div>
        </div>

        <div className="mt-2 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
          {sections.map((section) => (
            <details
              key={section.id}
              open={openSectionIds.has(section.id)}
              onToggle={(event) => toggleSection(section.id, event.currentTarget.open)}
              className="group border-b border-gray-100 last:border-b-0 dark:border-gray-800"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-gray-800 marker:content-none dark:text-white/90">
                <span className="min-w-0 truncate">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {section.sectionOrder}
                  </span>
                  {section.title}
                </span>
                <span className="shrink-0 text-xs font-medium text-brand-500 group-open:rotate-45">+</span>
              </summary>
              <div className="pb-4 pl-8">
                <p className="mb-2 text-xs font-medium text-gray-400">{section.modules.length} modul</p>
                <ul className="space-y-1">
                  {section.modules.map((module) => {
                    const isActive = module.id === activeModule.id;
                    const isCompleted = completedIds.has(module.id);

                    return (
                      <li key={module.id}>
                        <button
                          type="button"
                          onClick={() => openModule(module.id)}
                          className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                            isActive
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                              : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? "bg-success-500 text-white"
                                : "border border-gray-300 text-transparent dark:border-gray-600"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="min-w-0">
                            <span className="mr-1 font-semibold text-brand-600">{section.sectionOrder}.{module.moduleOrder}</span>
                            {module.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </aside>
    </div>
  );
}

function LearningObjectives({ value }: { value: unknown }) {
  const objectives = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

  if (!objectives.length) return null;

  return (
    <div className="mt-7 rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
      <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Tujuan belajar</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-brand-800 dark:text-brand-200">
        {objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </div>
  );
}

function MarkdownContent({ value }: { value: string | null }) {
  if (!value) {
    return <p className="mt-7 text-sm text-gray-500 dark:text-gray-400">Isi materi belum tersedia.</p>;
  }

  return (
    <div className="mt-7 space-y-3 text-sm leading-7 text-gray-700 dark:text-gray-200">
      {value.split("\n").map((line, index) => {
        const heading = line.match(/^(#{1,3})\s+(.+)/);
        const bullet = line.match(/^[-*]\s+(.+)/);

        if (heading) {
          const headingClass =
            heading[1].length === 1
              ? "text-xl font-semibold text-gray-900 dark:text-white"
              : "text-lg font-semibold text-gray-900 dark:text-white";
          return (
            <p key={`${line}-${index}`} className={headingClass}>
              {heading[2]}
            </p>
          );
        }

        if (bullet) {
          return (
            <p key={`${line}-${index}`} className="pl-4 before:mr-2 before:content-['•']">
              {bullet[1]}
            </p>
          );
        }

        return line.trim() ? <p key={`${line}-${index}`}>{line}</p> : <div key={`space-${index}`} />;
      })}
    </div>
  );
}
