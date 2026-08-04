"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { addTryoutsToLearningPath, reorderLearningPathTryouts } from "@/app/(admin)/dashboard/learning-path/[id]/actions";

export type LearningPathTryout = {
  id: string;
  title: string;
  status: string;
  totalQuestions: number;
  updatedAt: string;
};

export default function LearningPathDetailTabs({
  learningPathId,
  description,
  tryouts: initialTryouts,
  availableTryouts: initialAvailableTryouts,
}: {
  learningPathId: string;
  description: string;
  tryouts: LearningPathTryout[];
  availableTryouts: LearningPathTryout[];
}) {
  const [activeTab, setActiveTab] = useState<"information" | "tryouts">("information");
  const [tryouts, setTryouts] = useState(initialTryouts);
  const [availableTryouts, setAvailableTryouts] = useState(initialAvailableTryouts);
  const [showAddTryout, setShowAddTryout] = useState(false);
  const [tryoutQuery, setTryoutQuery] = useState("");
  const [selectedTryoutIds, setSelectedTryoutIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const tryoutSearchRef = useRef<HTMLInputElement>(null);
  const filteredAvailableTryouts = availableTryouts.filter((tryout) =>
    tryout.title.toLocaleLowerCase("id-ID").includes(tryoutQuery.trim().toLocaleLowerCase("id-ID"))
  );

  function toggleTryout(tryoutId: string) {
    if (isPending) return;
    setSelectedTryoutIds((current) => current.includes(tryoutId) ? current.filter((id) => id !== tryoutId) : [...current, tryoutId]);
  }

  function saveSelectedTryouts() {
    if (isPending || selectedTryoutIds.length === 0) return;
    const selectedTryouts = availableTryouts.filter((item) => selectedTryoutIds.includes(item.id));

    setMessage(null);
    startTransition(async () => {
      const result = await addTryoutsToLearningPath(learningPathId, selectedTryoutIds);
      if (!result.success) {
        setMessage({ tone: "error", text: result.error ?? "Gagal menambahkan tryout pilihan." });
        return;
      }

      setTryouts((current) => [...current, ...selectedTryouts]);
      setAvailableTryouts((current) => current.filter((item) => !selectedTryoutIds.includes(item.id)));
      setSelectedTryoutIds([]);
      setTryoutQuery("");
      setMessage({ tone: "success", text: `${selectedTryouts.length} tryout berhasil ditambahkan ke learning path.` });
      requestAnimationFrame(() => tryoutSearchRef.current?.focus());
    });
  }

  function moveTryout(targetId: string) {
    if (!draggedId || draggedId === targetId || isPending) return;
    const previous = tryouts;
    const fromIndex = previous.findIndex((item) => item.id === draggedId);
    const targetIndex = previous.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;

    const next = [...previous];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    setTryouts(next);
    setMessage(null);

    startTransition(async () => {
      const result = await reorderLearningPathTryouts(learningPathId, next.map((item) => item.id));
      if (!result.success) {
        setTryouts(previous);
        setMessage({ tone: "error", text: result.error ?? "Gagal menyimpan urutan tryout." });
      } else {
        setMessage({ tone: "success", text: "Urutan tryout berhasil disimpan." });
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex gap-1 border-b border-gray-100 px-5 pt-4 dark:border-gray-800 sm:px-6" role="tablist">
        {([['information', 'Informasi'], ['tryouts', `Tryout (${tryouts.length})`]] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)} className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === value ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "information" ? (
        <div className="p-5 sm:p-6" role="tabpanel">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Deskripsi Learning Path</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">{description || "Belum ada deskripsi."}</p>
        </div>
      ) : (
        <div className="p-5 sm:p-6" role="tabpanel">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Urutan Tryout</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tarik kartu untuk mengubah urutan tampil tryout.</p>
            </div>
            <div className="flex items-center gap-3">
              {isPending ? <span className="text-xs text-brand-500">Menyimpan...</span> : null}
              <button type="button" onClick={() => setShowAddTryout((current) => !current)} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600">
                + Tambah Tryout
              </button>
            </div>
          </div>
          {showAddTryout ? (
            <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label htmlFor="tryout-search" className="text-sm font-medium text-gray-700 dark:text-gray-200">Cari Tryout</label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Klik satu atau beberapa hasil, lalu tekan Enter untuk menyimpan semuanya.</p>
                </div>
                <button type="button" onClick={() => { setShowAddTryout(false); setTryoutQuery(""); }} disabled={isPending} className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">Selesai</button>
              </div>
              <div className="relative mt-2">
                <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900">
                  {availableTryouts.filter((tryout) => selectedTryoutIds.includes(tryout.id)).map((tryout) => (
                    <button key={tryout.id} type="button" onClick={() => toggleTryout(tryout.id)} disabled={isPending} title="Batalkan pilihan" className="inline-flex max-w-52 items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="truncate">{tryout.title}</span><span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <input ref={tryoutSearchRef} id="tryout-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="tryout-options" value={tryoutQuery} onChange={(event) => setTryoutQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && selectedTryoutIds.length > 0) { event.preventDefault(); saveSelectedTryouts(); } }} disabled={isPending} autoComplete="off" autoFocus placeholder={selectedTryoutIds.length ? "Cari lainnya..." : "Pilih beberapa tryout..."} className="h-7 min-w-40 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white/90" />
                  <span aria-hidden="true" className="shrink-0 text-gray-400">⌄</span>
                </div>
                <div id="tryout-options" className="relative z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900" role="listbox" aria-label="Pilihan tryout">
                  {filteredAvailableTryouts.map((tryout) => {
                    const selected = selectedTryoutIds.includes(tryout.id);
                    return <button key={tryout.id} type="button" role="option" aria-selected={selected} onClick={() => toggleTryout(tryout.id)} disabled={isPending} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition disabled:opacity-50 ${selected ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{tryout.title}</span>
                        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{tryout.totalQuestions} soal · {tryout.status}</span>
                      </span>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${selected ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 dark:border-gray-600"}`}>{selected ? "✓" : ""}</span>
                    </button>
                  })}
                  {filteredAvailableTryouts.length === 0 ? <p className="px-3 py-5 text-center text-sm text-gray-500 dark:text-gray-400">Tidak ada tryout yang cocok.</p> : null}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedTryoutIds.length ? `${selectedTryoutIds.length} tryout terpilih` : "Belum ada tryout dipilih"}</p>
                <button type="button" onClick={saveSelectedTryouts} disabled={selectedTryoutIds.length === 0 || isPending} className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? "Menyimpan..." : "Simpan (Enter)"}</button>
              </div>
              {availableTryouts.length === 0 ? <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tidak ada tryout tanpa learning path yang tersedia.</p> : null}
            </div>
          ) : null}
          {message ? <p className={`mb-4 text-sm ${message.tone === "success" ? "text-success-600" : "text-error-600"}`} role="status">{message.text}</p> : null}
          <div className="space-y-3">
            {tryouts.length ? tryouts.map((tryout, index) => (
              <article key={tryout.id} draggable={!isPending} onDragStart={() => setDraggedId(tryout.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTryout(tryout.id)} className={`flex cursor-grab items-center gap-4 rounded-xl border p-4 transition active:cursor-grabbing ${draggedId === tryout.id ? "border-brand-300 bg-brand-50/60 opacity-60 dark:bg-brand-500/10" : "border-gray-200 bg-gray-50 hover:border-brand-200 dark:border-gray-800 dark:bg-white/[0.03]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-brand-600 shadow-sm dark:bg-gray-900">{index + 1}</span>
                <span aria-hidden="true" className="select-none text-xl tracking-[-4px] text-gray-400">⠿</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{tryout.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tryout.totalQuestions} soal · Diperbarui {tryout.updatedAt}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-white/5 dark:text-gray-300">{tryout.status}</span>
                <Link href={`/dashboard/tryout-management/${tryout.id}/edit`} draggable={false} className="text-xs font-medium text-brand-500 hover:text-brand-600">Lihat</Link>
              </article>
            )) : <div className="rounded-xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Belum ada tryout pada learning path ini.</div>}
          </div>
        </div>
      )}
    </section>
  );
}
