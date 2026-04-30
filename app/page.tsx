import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/home/HeroSlider";
import LearningPathCarousel from "@/components/home/LearningPathCarousel";
import { createClient } from "@/lib/supabase/server";

type LearningPathRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: "draft" | "published" | "archived" | null;
};

type CourseRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  section_count: number | null;
  module_count: number | null;
  thumbnail: string | null;
  status?: "draft" | "published" | "archived" | null;
};

type TryoutRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  material_file_name: string | null;
  total_questions: number | null;
  status: "draft" | "published" | "archived" | null;
};

const heroSlides = [
  {
    id: 1,
    image: "/images/product/product-01.jpg",
    badge: "Event Live Class",
    title: "Bedah soal intensif untuk bantu kamu naik skor lebih terarah",
    description:
      "Ikuti sesi live bersama mentor, dapatkan pembahasan soal, strategi pengerjaan, dan rangkuman belajar mingguan.",
    meta: "Event berikutnya: 29 April 2026",
  },
  {
    id: 2,
    image: "/images/product/product-02.jpg",
    badge: "Promo Paket",
    title: "Paket materi dan tryout dalam beberapa slide promosi yang berganti otomatis",
    description:
      "Akses materi inti, evaluasi rutin, dan promo member baru dengan tampilan hero slider yang lebih hidup.",
    meta: "Promo berlaku hingga 30 April 2026",
  },
  {
    id: 3,
    image: "/images/product/product-05.jpg",
    badge: "Tryout Mingguan",
    title: "Simulasi berkala untuk memonitor progres dan kelemahan belajarmu",
    description:
      "Kerjakan tryout dari berbagai learning path lalu pelajari rekomendasi topik prioritas dari hasil pengerjaanmu.",
    meta: "Update soal baru setiap minggu",
  },
];

const materialImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getLearningPathGlyph(slug: string, title: string) {
  const key = `${slug} ${title}`.toLowerCase();

  if (key.includes("math") || key.includes("matematika") || key.includes("hitung")) return "M";
  if (key.includes("literasi") || key.includes("bahasa") || key.includes("reading")) return "Aa";
  if (key.includes("logic") || key.includes("logika") || key.includes("penalaran")) return "L";
  if (key.includes("science") || key.includes("sains") || key.includes("bio")) return "S";
  return title.slice(0, 1).toUpperCase();
}

function buildMaterialCards(paths: LearningPathRow[], courses: CourseRow[]) {
  return courses.map((course, index) => {
    const path = paths.find((item) => item.id === course.learning_path_id);

    return {
      id: course.id,
      title: course.title,
      learningPath: path?.title ?? "Learning Path Umum",
      image: course.thumbnail || materialImages[index % materialImages.length],
      sectionCount: course.section_count ?? 0,
      moduleCount: course.module_count ?? 0,
    };
  });
}

function buildTryoutCards(tryouts: TryoutRow[], learningPathMap: Map<string, string>) {
  return tryouts.map((item, index) => {
    return {
      ...item,
      image: materialImages[index % materialImages.length],
      href: `/tryout/${item.id}/${slugify(item.title)}`,
      learningPath: item.learning_path_id
        ? learningPathMap.get(item.learning_path_id) || "Learning Path"
        : "Tryout Umum",
    };
  });
}

function groupTryoutCardsByLearningPath(
  cards: ReturnType<typeof buildTryoutCards>
) {
  const grouped = new Map<string, typeof cards>();

  cards.forEach((card) => {
    const current = grouped.get(card.learningPath) ?? [];
    current.push(card);
    grouped.set(card.learningPath, current);
  });

  return Array.from(grouped.entries()).map(([learningPath, items]) => ({
    learningPath,
    items,
  }));
}

function getCardTone(index: number) {
  const tones = [
    "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
    "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400",
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  ];

  return tones[index % tones.length];
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: learningPathRows }, { data: tryoutRows }, { data: courseRows }] =
    await Promise.all([
      supabase
        .from("learning_paths")
        .select("id, title, slug, description, status")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("tryouts")
        .select("id, title, learning_path_id, material_file_name, total_questions, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("courses")
        .select("id, title, learning_path_id, section_count, module_count, thumbnail, status")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const tryouts = (tryoutRows as TryoutRow[] | null) ?? [];
  const courses = (courseRows as CourseRow[] | null) ?? [];
  const learningPathMap = new Map(learningPaths.map((item) => [item.id, item.title]));
  const materialCountMap = new Map<string, number>();

  courses.forEach((item) => {
    if (!item.learning_path_id) return;
    materialCountMap.set(
      item.learning_path_id,
      (materialCountMap.get(item.learning_path_id) ?? 0) + 1
    );
  });

  const learningPathItems = (learningPaths.length
    ? learningPaths
    : [
        {
          id: "fallback-1",
          title: "Dasar UTBK",
          slug: "dasar-utbk",
          description: "Fondasi belajar konsep inti dan latihan awal.",
          status: "published" as const,
        },
        {
          id: "fallback-2",
          title: "Literasi & Membaca",
          slug: "literasi-membaca",
          description: "Fokus memahami bacaan dan strategi menjawab cepat.",
          status: "published" as const,
        },
        {
          id: "fallback-3",
          title: "Penalaran Intensif",
          slug: "penalaran-intensif",
          description: "Latihan logika, pola, dan analisis soal bertahap.",
          status: "published" as const,
        },
        {
          id: "fallback-4",
          title: "Simulasi Tryout",
          slug: "simulasi-tryout",
          description: "Persiapan evaluasi berkala dengan simulasi ujian.",
          status: "published" as const,
        },
      ]) as LearningPathRow[];

  const materialCards = buildMaterialCards(learningPaths, courses);
  const tryoutCards = buildTryoutCards(tryouts, learningPathMap);
  const groupedTryoutCards = groupTryoutCardsByLearningPath(tryoutCards);
  const carouselItems = learningPathItems.map((path) => ({
    id: path.id,
    title: path.title,
    slug: path.slug,
    description: path.description,
    materialCount: materialCountMap.get(path.id) ?? 0,
    glyph: getLearningPathGlyph(path.slug, path.title),
  }));

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-blue-light-25 to-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-brand-100/70 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-theme-sm">
              <Image
                src="/images/logo/logo-icon.svg"
                alt="Logo platform belajar"
                width={20}
                height={20}
              />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">Course Online</p>
              <p className="text-xs text-gray-500">Materi dan tryout terarah</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#hero" className="transition hover:text-brand-600">
              Hero
            </a>
            <a href="#learning-path" className="transition hover:text-brand-600">
              Learning Path
            </a>
            <a href="#materi" className="transition hover:text-brand-600">
              Materi
            </a>
            <a href="#tryout" className="transition hover:text-brand-600">
              Tryout
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 sm:inline-flex"
            >
              Dashboard
            </Link>
            <a
              href="#cta"
              className="inline-flex rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
            >
              Mulai
            </a>
          </div>
        </div>
      </nav>

      <section id="hero" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <span className="inline-flex rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 shadow-theme-xs">
              Event, promo, dan tryout
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-[44px] lg:leading-[1.1]">
              Homepage belajar yang lebih clean, ringkas, dan tetap informatif.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Temukan promo berjalan, jalur belajar, materi pilihan, dan tryout terbaru dengan
              tampilan putih-biru yang lebih padat.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#learning-path"
                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Lihat Learning Path
              </a>
              <a
                href="#materi"
                className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                Lihat Materi
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-theme-xs">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Slide Promo</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{heroSlides.length}</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-theme-xs">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Learning Path</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {learningPathItems.length}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-theme-xs">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Tryout Aktif</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{tryouts.length}</p>
              </div>
            </div>
          </div>

          <HeroSlider slides={heroSlides} />
        </div>
      </section>

      <section id="learning-path" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Learning Path
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              Semua learning path dalam carousel yang lebih ringkas
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Gunakan tombol panah untuk menggeser kartu dan melihat jumlah materi di setiap jalur.
            </p>
          </div>
          <p className="text-sm font-semibold text-brand-600">
            Total {learningPathItems.length} learning path
          </p>
        </div>

        <LearningPathCarousel items={carouselItems} />
      </section>

      <section id="materi" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Koleksi Materi
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              Materi pilihan dengan section dan modul
            </h2>
          </div>
          <Link
            href="/courses"
            className="inline-flex shrink-0 rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Tampilkan Semua
          </Link>
        </div>

        {materialCards.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {materialCards.map((card, index) => (
              <article
                key={card.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm transition duration-300 hover:-translate-y-1 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="relative h-44 overflow-hidden border-b border-gray-100 dark:border-gray-800">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-white/60 bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-700">
                      Materi
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                      {card.learningPath}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getCardTone(index)}`}
                    >
                      {card.moduleCount} modul
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-gray-800 transition group-hover:text-brand-600 dark:text-white/90">
                    {card.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {card.learningPath}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Materi terstruktur untuk bantu kamu belajar lebih terarah dengan progres yang
                    terasa rapi.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                      {card.sectionCount} section
                    </span>
                    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                      {card.moduleCount} modul
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      Siap dipelajari
                    </span>
                    <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5">
                      Lihat materi
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white px-5 py-4 text-sm text-gray-500">
            Materi belum tersedia.
          </div>
        )}
      </section>

      <section id="tryout" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Koleksi Tryout
              </span>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
                Tryout terbaru dengan tampilan lebih padat
              </h2>
            </div>
            <Link
              href="/tryouts"
              className="inline-flex shrink-0 rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Tampilkan Semua
            </Link>
          </div>

          {tryoutCards.length ? (
            <div className="mt-5 space-y-6">
              {groupedTryoutCards.map((group) => (
                <div key={group.learningPath} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.learningPath}</h3>
                      <p className="text-sm text-gray-500">
                        Menampilkan tryout dari learning path {group.learningPath}.
                      </p>
                    </div>
                    <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {group.items.length} tryout
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {group.items.map((card, index) => (
                      <Link
                        key={`${group.learningPath}-${card.id}-${card.image}`}
                        href={card.href}
                        className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm transition duration-300 hover:-translate-y-1 hover:shadow-theme-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-white/[0.03]"
                      >
                        <div className="relative h-44 overflow-hidden border-b border-gray-100 dark:border-gray-800">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                          />
                          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                            <span className="inline-flex rounded-full border border-white/60 bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-700">
                              Tryout
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getCardTone(index)}`}
                            >
                              {card.total_questions ?? 0} soal
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                            {group.learningPath}
                          </p>
                          <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-gray-800 transition group-hover:text-brand-600 dark:text-white/90">
                            {card.title}
                          </h3>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                            Uji pemahamanmu dengan simulasi yang lebih cepat diakses dan lebih nyaman
                            dikerjakan.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                              {card.total_questions ?? 0} soal
                            </span>
                            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                              Siap dikerjakan
                            </span>
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                              Evaluasi terbaru
                            </span>
                            <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5">
                              Kerjakan
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white px-5 py-4 text-sm text-gray-500">
              Tryout belum tersedia.
            </div>
          )}
        </div>
      </section>

      <section id="cta" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-[28px] border border-brand-100 bg-white px-5 py-6 shadow-theme-sm sm:px-6 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Mulai Sekarang
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              Susun ritme belajar yang lebih konsisten
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Akses materi, ikuti tryout, dan pantau perkembanganmu dari dashboard dalam satu
              alur yang lebih sederhana.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <a
              href="#materi"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Jelajahi Materi
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-100 bg-gray-900 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <p className="text-lg font-semibold text-white">Course Online</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
              Platform pembelajaran dengan materi, learning path, event, dan tryout yang lebih
              terstruktur.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Navigasi</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href="#hero" className="block transition hover:text-white">
                Hero
              </a>
              <a href="#learning-path" className="block transition hover:text-white">
                Learning Path
              </a>
              <a href="#materi" className="block transition hover:text-white">
                Materi
              </a>
              <a href="#tryout" className="block transition hover:text-white">
                Tryout
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Program</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>Event Live Class</p>
              <p>Materi Premium</p>
              <p>Tryout Berkala</p>
              <p>Dashboard Belajar</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Kontak</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>hello@courseonline.id</p>
              <p>+62 812 0000 0000</p>
              <p>Senin - Sabtu, 08.00 - 20.00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>(c) 2026 Course Online. Semua hak dilindungi.</p>
            <div className="flex flex-wrap gap-4">
              <p>Kebijakan Privasi</p>
              <p>Syarat Layanan</p>
              <p>Bantuan</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
