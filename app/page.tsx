import Link from "next/link";
import { cookies } from "next/headers";
import PublicNavbar from "@/components/header/PublicNavbar";
import BrandLogo from "@/components/header/BrandLogo";
import CourseList, { type CourseCard } from "@/components/home/CourseList";
import HeroSlider from "@/components/home/HeroSlider";
import LearningPathList, { type LearningPathCard } from "@/components/home/LearningPathList";
import TryoutList, { type TryoutCard } from "@/components/home/TryoutList";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";
import { slugify } from "@/lib/text";

type CourseRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  section_count: number | null;
  module_count: number | null;
  thumbnail: string | null;
  status?: "draft" | "published" | "archived" | null;
};

type TryoutRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  total_questions: number | null;
  thumbnail_url: string | null;
  status: "draft" | "published" | "archived" | null;
};

type LearningPathRow = {
  id: string;
  title: string;
};

type LearningPathTryoutRow = {
  learning_path_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

const heroSlides = [
  {
    id: 1,
    badge: "CPNS",
    title: "Jelajahi Kursus & Tryout CPNS Terbaik",
    image: "/images/hero/hero-cpns.png",
    description: "",
    meta: "Materi SKD, SKB, dan tryout CAT dalam satu jalur belajar",
  },
  {
    id: 2,
    badge: "Bahasa Inggris",
    title: "Tingkatkan Skill Bahasa Inggris Anda",
    image: "/images/hero/hero-english.png",
    description: "",
    meta: "Kuasai grammar, TOEFL, IELTS, serta speaking dengan percaya diri",
  },
  {
    id: 3,
    badge: "TI & Perangkat Lunak",
    title: "Bangun Skill Teknologi untuk Masa Depan",
    image: "/images/hero/hero-it.png",
    description: "",
    meta: "Belajar web development, data science, dan tools profesional",
  },
];

const categories = [
  {
    title: "CPNS",
    description: "Materi lengkap SKD & SKB, latihan soal, dan tryout simulasi sesuai standar BKN.",
    count: "32 kelas",
    tone: "bg-brand-50 text-brand-600",
    icon: <BriefcaseIcon />,
  },
  {
    title: "Bahasa Inggris",
    description: "TOEFL, IELTS, dan percakapan profesional untuk karier dan studi lanjut.",
    count: "28 kelas",
    tone: "bg-[#eef0ff] text-[#4f46e5]",
    icon: <LanguageIcon />,
  },
  {
    title: "TI & Perangkat Lunak",
    description: "Web development, data science, dan tools profesional dari dasar hingga mahir.",
    count: "45 kelas",
    tone: "bg-[#e9fbf8] text-[#0891b2]",
    icon: <CodeIcon />,
  },
];

function resolveCourseCategory(title: string, index: number) {
  const value = title.toLowerCase();

  if (value.includes("cpns") || value.includes("skd") || value.includes("twk")) return "CPNS";
  if (value.includes("english") || value.includes("inggris") || value.includes("toefl")) {
    return "Bahasa Inggris";
  }
  if (value.includes("web") || value.includes("data") || value.includes("ti")) {
    return "TI & Perangkat Lunak";
  }

  return ["CPNS", "Bahasa Inggris", "TI & Perangkat Lunak"][index % 3];
}

function getCourseCardBackground(category: string) {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("cpns")) return "#2563EB";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "#1D4ED8";
  }

  return "#1E40AF";
}

function getHomepageCategoryTitle(category: string | null | undefined) {
  const normalizedCategory = category?.trim().toLowerCase() ?? "";

  if (normalizedCategory.includes("cpns")) return "CPNS";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "Bahasa Inggris";
  }
  if (
    normalizedCategory === "ti" ||
    normalizedCategory === "it" ||
    normalizedCategory.includes("teknologi") ||
    normalizedCategory.includes("perangkat lunak")
  ) {
    return "TI & Perangkat Lunak";
  }

  return null;
}

function buildCourseHref(course: CourseRow | undefined) {
  if (!course) return "/";
  return `/course/${course.id}/${slugify(course.title)}`;
}

function buildCourseCards(
  courses: CourseRow[],
  categoryMap: Map<string, string>,
  subCategoryMap: Map<string, string>
): CourseCard[] {
  if (!courses.length) return [];

  return courses.slice(0, 8).map((course, index) => {
    const category =
      (course.category_id ? categoryMap.get(course.category_id)?.trim() : undefined) ||
      resolveCourseCategory(course.title, index);

    return {
      id: course.id,
      title: course.title,
      category,
      subCategory:
        (course.sub_category_id ? subCategoryMap.get(course.sub_category_id)?.trim() : undefined) ||
        "Umum",
      backgroundColor: getCourseCardBackground(category),
      href: buildCourseHref(course),
    };
  });
}

function buildTryoutHref(tryout: TryoutRow | undefined) {
  if (!tryout) return "/tryouts";
  return `/tryout/${tryout.id}/${slugify(tryout.title)}`;
}

function buildTryoutCards(
  tryouts: TryoutRow[],
  categoryMap: Map<string, string>,
  subCategoryMap: Map<string, string>
): TryoutCard[] {
  if (!tryouts.length) return [];

  return tryouts.slice(0, 8).map((tryout, index) => {
    const category =
      (tryout.category_id ? categoryMap.get(tryout.category_id)?.trim() : undefined) ||
      resolveCourseCategory(tryout.title, index);

    return {
      id: tryout.id,
      title: tryout.title,
      category,
      subCategory:
        (tryout.sub_category_id ? subCategoryMap.get(tryout.sub_category_id)?.trim() : undefined) ||
        "Umum",
      backgroundColor: getCourseCardBackground(category),
      href: buildTryoutHref(tryout),
    };
  });
}

function buildLearningPathCards(
  learningPaths: LearningPathRow[],
  tryoutCounts: Map<string, number>
): LearningPathCard[] {
  return learningPaths.slice(0, 8).map((learningPath, index) => {
    const category = resolveCourseCategory(learningPath.title, index);

    return {
      id: learningPath.id,
      title: learningPath.title,
      tryoutCount: tryoutCounts.get(learningPath.id) ?? 0,
      backgroundColor: getCourseCardBackground(category),
      href: `/learning-path/${learningPath.id}`,
    };
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: tryoutRows },
    { data: courseRows },
    { data: learningPathRows },
    { data: learningPathTryoutRows },
    { data: categoryRows },
    { data: subCategoryRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tryouts")
      .select(
        "id, title, learning_path_id, category_id, sub_category_id, total_questions, thumbnail_url, status"
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("courses")
      .select(
        "id, title, learning_path_id, category_id, sub_category_id, section_count, module_count, thumbnail, status"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_paths")
      .select("id, title")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("tryouts")
      .select("learning_path_id")
      .eq("status", "published")
      .not("learning_path_id", "is", null),
    supabase.from("categories").select("id, name"),
    supabase.from("sub_categories").select("id, category_id, name"),
  ]);

  const isLoggedIn = Boolean(user);
  const userProfile = getUserProfile(user);
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const tryouts = (tryoutRows as TryoutRow[] | null) ?? [];
  const courses = (courseRows as CourseRow[] | null) ?? [];
  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const learningPathTryoutCounts = new Map<string, number>();
  ((learningPathTryoutRows as LearningPathTryoutRow[] | null) ?? []).forEach((tryout) => {
    if (tryout.learning_path_id) {
      learningPathTryoutCounts.set(
        tryout.learning_path_id,
        (learningPathTryoutCounts.get(tryout.learning_path_id) ?? 0) + 1
      );
    }
  });
  const categoryMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategoryMap = new Map(
    ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => [item.id, item.name])
  );
  const categoryCourseCounts = new Map(categories.map((category) => [category.title, 0]));

  courses.forEach((course) => {
    const directCategory = course.category_id ? categoryMap.get(course.category_id) : null;
    const categoryTitle = getHomepageCategoryTitle(directCategory);

    if (categoryTitle) {
      categoryCourseCounts.set(categoryTitle, (categoryCourseCounts.get(categoryTitle) ?? 0) + 1);
    }
  });

  const categoryCards = categories.map((category) => ({
    ...category,
    count: `${categoryCourseCounts.get(category.title) ?? 0} kelas`,
  }));
  const courseCards = buildCourseCards(courses, categoryMap, subCategoryMap);
  const learningPathCards = buildLearningPathCards(learningPaths, learningPathTryoutCounts);
  const tryoutCards = buildTryoutCards(tryouts, categoryMap, subCategoryMap);
  const actionHref = isLoggedIn ? "/app" : "/register";
  const createTryoutHref = accountRole === "admin"
    ? "/dashboard/tryout-management/create"
    : actionHref;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <PublicNavbar
        userProfile={isLoggedIn ? userProfile : null}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        showUserDropdown={false}
      />

      <section id="beranda" className="mx-auto max-w-[1080px] px-4 pb-10 pt-8 sm:pb-12 sm:px-6 lg:px-0">
        <HeroSlider slides={heroSlides} />
      </section>

      <section className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Pilih Kategori Belajarmu"
          description="Tiga jalur pembelajaran utama yang dirancang untuk membantumu mencapai target."
          centered
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {categoryCards.map((category) => (
            <article
              key={category.title}
              className="rounded-lg border border-gray-200 bg-white p-7 shadow-[0_12px_32px_rgba(16,24,40,0.04)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_40px_rgba(16,24,40,0.08)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${category.tone}`}>
                {category.icon}
              </div>
              <h3 className="mt-7 text-base font-semibold text-gray-900">{category.title}</h3>
              <p className="mt-4 min-h-[72px] text-sm leading-6 text-gray-600">
                {category.description}
              </p>
              <a
                href="#kelas"
                className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                {category.count}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="learning-path" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Learning Path Pilihan"
          description="Ikuti jalur belajar terstruktur untuk mencapai targetmu langkah demi langkah."
        />
        {learningPathCards.length ? (
          <LearningPathList items={learningPathCards} />
        ) : (
          <p className="mt-8 text-sm text-gray-500">Learning path belum tersedia</p>
        )}
      </section>

      <section id="kelas" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Kelas Populer Pilihan"
          description="Materi terkurasi yang paling banyak diikuti oleh siswa kami."
        />
        {courseCards.length ? (
          <CourseList courses={courseCards} actionHref={actionHref} />
        ) : (
          <p className="mt-8 text-sm text-gray-500">Course belum tersedia</p>
        )}
      </section>

      <section id="tryout" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Tryout Populer Pilihan"
          description="Latihan dan simulasi tryout untuk mengukur progres belajarmu."
        />
        {tryoutCards.length ? (
          <TryoutList tryouts={tryoutCards} />
        ) : (
          <p className="mt-8 text-sm text-gray-500">Tryout belum tersedia</p>
        )}
      </section>

      <section id="promo-tryout" className="bg-gray-50">
        <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
          <div className="grid gap-8 rounded-lg border border-gray-200 bg-white p-7 shadow-[0_16px_48px_rgba(16,24,40,0.06)] md:grid-cols-[1fr_0.9fr] md:items-center lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50">
                  <TargetIcon />
                </span>
                Tryout dari materimu sendiri
              </div>
              <h2 className="mt-6 max-w-xl text-2xl font-semibold leading-tight text-gray-950">
                Punya materi yang ingin benar-benar kamu kuasai?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
                Unggah PDF yang sedang kamu pelajari, lalu ubah materinya menjadi latihan yang
                bisa langsung kamu kerjakan. Cocok untuk persiapan ujian, mengulang materi kelas,
                atau mengecek bagian mana yang masih perlu kamu pahami lagi.
              </p>

              <Link
                href={createTryoutHref}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-6 text-sm font-medium text-white shadow-theme-sm transition hover:bg-brand-700"
              >
                Buat tryout dari materiku
              </Link>
            </div>

            <div className="rounded-lg bg-linear-to-br from-brand-500 to-[#075be8] p-7 text-white shadow-[0_18px_38px_rgba(70,95,255,0.24)]">
              <p className="text-sm font-semibold text-white">Caranya sederhana</p>
              <div className="mt-5 space-y-3">
                {[
                  ["1", "Pilih dan unggah PDF materimu."],
                  ["2", "Tentukan jumlah soal dan durasi pengerjaan."],
                  ["3", "Kerjakan tryout, lalu lihat bagian yang masih perlu dipelajari."],
                ].map(([number, text]) => (
                  <div key={number} className="flex items-start gap-3 rounded-lg bg-white/10 p-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">{number}</span>
                    <p className="pt-0.5 text-sm leading-6 text-white/90">{text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-white/75">
                Materimu tetap menjadi sumber utama, jadi soal yang dibuat tetap dekat dengan apa yang sedang kamu pelajari.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] lg:px-0">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-6 text-gray-600">
              Platform belajar online untuk persiapan CPNS, Bahasa Inggris, dan Teknologi
              Informasi. Belajar terarah, raih targetmu.
            </p>
            <div className="mt-6 flex gap-3">
              {["Fb", "Ig", "Tw", "Yt"].map((item) => (
                <a
                  key={item}
                  href="#beranda"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500 transition hover:border-brand-200 hover:text-brand-600"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Kategori" items={["CPNS", "Bahasa Inggris", "TI & Perangkat Lunak", "Tryout"]} />
          <FooterColumn title="Perusahaan" items={["Tentang Kami", "Karier", "Blog", "Kontak"]} />
          <FooterColumn title="Bantuan" items={["Pusat Bantuan", "Syarat & Ketentuan", "Kebijakan Privasi", "FAQ"]} />
        </div>

        <div className="border-t border-gray-200">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-6 text-xs text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-0">
            <p>Copyright 2026 EduPrime. Seluruh hak cipta dilindungi.</p>
            <p>Dibuat untuk masa depan pendidikan Indonesia.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  title,
  description,
  centered = false,
}: {
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 className="text-2xl font-semibold leading-tight text-gray-950">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-950">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <a key={item} href="#beranda" className="block text-sm font-medium text-gray-600 hover:text-brand-600">
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.5 7V5.8A1.8 1.8 0 0 1 8.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7M4.8 16h10.4a1.8 1.8 0 0 0 1.8-1.8V8.8A1.8 1.8 0 0 0 15.2 7H4.8A1.8 1.8 0 0 0 3 8.8v5.4A1.8 1.8 0 0 0 4.8 16Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 5h7M7.5 3v2m1.8 0c-.7 3.3-2.4 5.5-5.3 7m1.8-5c1 2 2.4 3.5 4.2 4.6M11 17l3.5-8 3.5 8m-1.2-2.7h-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m7.5 6-4 4 4 4M12.5 6l4 4-4 4M11 4.5l-2 11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10h12m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
