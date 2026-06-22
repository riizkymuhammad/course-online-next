import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import PublicNavbar from "@/components/header/PublicNavbar";
import CourseList, { type CourseCard } from "@/components/home/CourseList";
import HeroSlider from "@/components/home/HeroSlider";
import TryoutList, { type TryoutCard } from "@/components/home/TryoutList";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";

type LearningPathRow = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  sub_category: string | null;
  sub_sub_category: string | null;
  status: "draft" | "published" | "archived" | null;
};

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

const fallbackCourses: CourseCard[] = [
  {
    id: "fallback-course-1",
    title: "Persiapan SKD CPNS: TWK, TIU & TKP Lengkap",
    category: "CPNS",
    subCategory: "SKD",
    backgroundColor: "#144272",
  },
  {
    id: "fallback-course-2",
    title: "TOEFL ITP Mastery: Score 550+ in 30 Days",
    category: "Bahasa Inggris",
    subCategory: "TOEFL",
    backgroundColor: "#205295",
  },
  {
    id: "fallback-course-3",
    title: "Fullstack Web Development dengan React & Node",
    category: "TI & Perangkat Lunak",
    subCategory: "Web Development",
    backgroundColor: "#2C74B3",
  },
  {
    id: "fallback-course-4",
    title: "Bedah Kisi-Kisi TIU: Logika & Numerik",
    category: "CPNS",
    subCategory: "TIU",
    backgroundColor: "#144272",
  },
  {
    id: "fallback-course-5",
    title: "English Conversation for Professionals",
    category: "Bahasa Inggris",
    subCategory: "Conversation",
    backgroundColor: "#205295",
  },
  {
    id: "fallback-course-6",
    title: "Python untuk Data Science & Analitik",
    category: "TI & Perangkat Lunak",
    subCategory: "Data Science",
    backgroundColor: "#2C74B3",
  },
  {
    id: "fallback-course-7",
    title: "Strategi Jitu Menjawab TKP Skor Maksimal",
    category: "CPNS",
    subCategory: "TKP",
    backgroundColor: "#144272",
  },
  {
    id: "fallback-course-8",
    title: "IELTS Academic: Writing & Speaking Booster",
    category: "Bahasa Inggris",
    subCategory: "IELTS",
    backgroundColor: "#205295",
  },
];

const fallbackTryouts: TryoutCard[] = [
  {
    id: "fallback-tryout-1",
    title: "Tryout SKD CPNS: TWK, TIU & TKP",
    category: "CPNS",
    subCategory: "SKD",
    backgroundColor: "#144272",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-2",
    title: "Simulasi TOEFL ITP Lengkap",
    category: "Bahasa Inggris",
    subCategory: "TOEFL",
    backgroundColor: "#205295",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-3",
    title: "Tryout Sertifikasi Web Development",
    category: "TI & Perangkat Lunak",
    subCategory: "Web Development",
    backgroundColor: "#2C74B3",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-4",
    title: "Latihan TIU: Logika & Numerik",
    category: "CPNS",
    subCategory: "TIU",
    backgroundColor: "#144272",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-5",
    title: "IELTS Academic Practice Test",
    category: "Bahasa Inggris",
    subCategory: "IELTS",
    backgroundColor: "#205295",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-6",
    title: "Coding Challenge Dasar",
    category: "TI & Perangkat Lunak",
    subCategory: "Programming",
    backgroundColor: "#2C74B3",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-7",
    title: "Strategi Menjawab Soal TKP",
    category: "CPNS",
    subCategory: "TKP",
    backgroundColor: "#144272",
    href: "/tryouts",
  },
  {
    id: "fallback-tryout-8",
    title: "English Grammar Assessment",
    category: "Bahasa Inggris",
    subCategory: "Grammar",
    backgroundColor: "#205295",
    href: "/tryouts",
  },
];

const testimonials = [
  {
    quote:
      "Materi TWK dan TIU-nya sangat terstruktur. Tryout-nya benar-benar mirip dengan ujian asli.",
    name: "Dimas Aryo",
    role: "Lulus CPNS Kemenkeu 2025",
    initials: "DA",
  },
  {
    quote:
      "Mentornya sabar dan metodenya mudah dipahami. Skor TOEFL saya naik drastis hanya dalam sebulan belajar.",
    name: "Nabila Putri",
    role: "Score TOEFL 587",
    initials: "NP",
  },
  {
    quote:
      "Dari nol sampai bisa bikin aplikasi fullstack. Kelas TI-nya praktis dan langsung bisa dipakai kerja.",
    name: "Rizky Hidayat",
    role: "Junior Web Developer",
    initials: "RH",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

  if (normalizedCategory.includes("cpns")) return "#144272";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "#205295";
  }

  return "#2C74B3";
}

function buildCourseCards(
  courses: CourseRow[],
  learningPathMap: Map<string, LearningPathRow>,
  categoryMap: Map<string, string>,
  subCategoryMap: Map<string, string>
): CourseCard[] {
  if (!courses.length) return fallbackCourses;

  return courses.slice(0, 8).map((course, index) => {
    const learningPath = course.learning_path_id
      ? learningPathMap.get(course.learning_path_id)
      : undefined;

    const category =
      learningPath?.category?.trim() ||
      (course.category_id ? categoryMap.get(course.category_id)?.trim() : undefined) ||
      resolveCourseCategory(course.title, index);

    return {
      id: course.id,
      title: course.title,
      category,
      subCategory:
        learningPath?.sub_category?.trim() ||
        learningPath?.sub_sub_category?.trim() ||
        (course.sub_category_id ? subCategoryMap.get(course.sub_category_id)?.trim() : undefined) ||
        "Umum",
      backgroundColor: getCourseCardBackground(category),
    };
  });
}

function buildTryoutHref(tryout: TryoutRow | undefined) {
  if (!tryout) return "/tryouts";
  return `/tryout/${tryout.id}/${slugify(tryout.title)}`;
}

function buildTryoutCards(
  tryouts: TryoutRow[],
  learningPathMap: Map<string, LearningPathRow>,
  categoryMap: Map<string, string>,
  subCategoryMap: Map<string, string>
): TryoutCard[] {
  if (!tryouts.length) return fallbackTryouts;

  return tryouts.slice(0, 8).map((tryout, index) => {
    const learningPath = tryout.learning_path_id
      ? learningPathMap.get(tryout.learning_path_id)
      : undefined;
    const category =
      learningPath?.category?.trim() ||
      (tryout.category_id ? categoryMap.get(tryout.category_id)?.trim() : undefined) ||
      resolveCourseCategory(tryout.title, index);

    return {
      id: tryout.id,
      title: tryout.title,
      category,
      subCategory:
        learningPath?.sub_category?.trim() ||
        learningPath?.sub_sub_category?.trim() ||
        (tryout.sub_category_id ? subCategoryMap.get(tryout.sub_category_id)?.trim() : undefined) ||
        "Umum",
      backgroundColor: getCourseCardBackground(category),
      href: buildTryoutHref(tryout),
    };
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: learningPathRows },
    { data: tryoutRows },
    { data: courseRows },
    { data: categoryRows },
    { data: subCategoryRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("learning_paths")
      .select("id, title, slug, category, sub_category, sub_sub_category, status")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
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
      .order("created_at", { ascending: false })
      .limit(12),
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
  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const tryouts = (tryoutRows as TryoutRow[] | null) ?? [];
  const courses = (courseRows as CourseRow[] | null) ?? [];
  const learningPathMap = new Map(
    learningPaths.map((item) => [item.id, item])
  );
  const categoryMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategoryMap = new Map(
    ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => [item.id, item.name])
  );
  const courseCards = buildCourseCards(courses, learningPathMap, categoryMap, subCategoryMap);
  const tryoutCards = buildTryoutCards(tryouts, learningPathMap, categoryMap, subCategoryMap);
  const featuredTryout = tryouts[0];
  const tryoutHref = buildTryoutHref(featuredTryout);
  const actionHref = isLoggedIn ? "/app" : "/register";

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
          {categories.map((category) => (
            <article
              key={category.title}
              className="rounded-lg border border-gray-200 bg-white p-7 shadow-[0_12px_32px_rgba(16,24,40,0.04)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_40px_rgba(16,24,40,0.08)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${category.tone}`}>
                {category.icon}
              </div>
              <h3 className="mt-7 text-base font-bold text-gray-900">{category.title}</h3>
              <p className="mt-4 min-h-[72px] text-sm leading-6 text-gray-600">
                {category.description}
              </p>
              <a
                href="#kelas"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-brand-600 transition hover:text-brand-700"
              >
                {category.count}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="kelas" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Kelas Populer Pilihan"
          description="Materi terkurasi yang paling banyak diikuti oleh siswa kami."
        />
        <CourseList courses={courseCards} actionHref={actionHref} />
      </section>

      <section id="tryout" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Tryout Populer Pilihan"
          description="Latihan dan simulasi tryout untuk mengukur progres belajarmu."
        />
        <TryoutList tryouts={tryoutCards} />
      </section>

      <section id="promo-tryout" className="bg-gray-50">
        <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
          <div className="grid gap-8 rounded-lg border border-gray-200 bg-white p-7 shadow-[0_16px_48px_rgba(16,24,40,0.06)] md:grid-cols-[1fr_0.9fr] md:items-center lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50">
                  <TargetIcon />
                </span>
                Tryout Akbar CPNS 2026
              </div>
              <h2 className="mt-6 max-w-xl text-2xl font-bold leading-tight text-gray-950 sm:text-3xl">
                {featuredTryout?.title || "Simulasi Tryout SKD Gratis untuk Ribuan Peserta"}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
                Uji kemampuanmu dengan soal sesuai standar BKN, dapatkan ranking nasional,
                dan analisis hasil mendetail.
              </p>

              <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center gap-2">
                  <UsersIcon />
                  8.420 peserta terdaftar
                </span>
                <span className="inline-flex items-center gap-2">
                  <GiftIcon />
                  Hadiah voucher kelas premium
                </span>
              </div>

              <Link
                href={tryoutHref}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-6 text-sm font-bold text-white shadow-theme-sm transition hover:bg-brand-700"
              >
                Daftar Tryout Gratis
              </Link>
            </div>

            <div className="rounded-lg bg-linear-to-br from-brand-500 to-[#075be8] p-7 text-white shadow-[0_18px_38px_rgba(70,95,255,0.24)]">
              <p className="text-center text-sm font-semibold text-white/85">
                Pendaftaran ditutup dalam
              </p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {[
                  ["07", "Hari"],
                  ["04", "Jam"],
                  ["59", "Menit"],
                  ["50", "Detik"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-white/12 px-2 py-4 text-center">
                    <p className="text-2xl font-bold leading-none sm:text-3xl">{value}</p>
                    <p className="mt-2 text-xs font-semibold text-white/80">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-xs leading-5 text-white/75">
                Pelaksanaan serentak online. Sertifikat peserta tersedia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 sm:py-12 lg:px-0">
        <SectionHeading
          title="Apa Kata Mereka"
          description="Ribuan siswa telah mencapai targetnya bersama EduPrime."
          centered
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-lg border border-gray-200 bg-white p-7 shadow-[0_12px_32px_rgba(16,24,40,0.04)]"
            >
              <QuoteIcon />
              <div className="mt-5 flex gap-1 text-[#f59e0b]" aria-label="Rating 5 dari 5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} />
                ))}
              </div>
              <p className="mt-5 min-h-[96px] text-sm leading-6 text-gray-700">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                  {testimonial.initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-900">{testimonial.name}</span>
                  <span className="block text-xs font-medium text-gray-500">{testimonial.role}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] lg:px-0">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt=""
                  width={17}
                  height={17}
                  className="brightness-0 invert"
                />
              </span>
              <span className="text-sm font-bold text-gray-900">
                Edu<span className="text-brand-600">Prime</span>
              </span>
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
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-500 transition hover:border-brand-200 hover:text-brand-600"
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
          <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-6 text-xs font-medium text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-0">
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
      <h2 className="text-3xl font-bold leading-tight text-gray-950">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-950">{title}</h3>
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

function StarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="m10 1.7 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L10 1.7Z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="h-8 w-8 text-brand-100" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M12.5 8c-4 2.5-6 5.7-6 9.7 0 3.6 2 6.3 5.3 6.3 2.8 0 4.7-1.9 4.7-4.5 0-2.4-1.7-4.1-4-4.1-.6 0-1.1.1-1.6.3.4-1.7 1.8-3.4 4.1-5.1L12.5 8Zm13 0c-4 2.5-6 5.7-6 9.7 0 3.6 2 6.3 5.3 6.3 2.8 0 4.7-1.9 4.7-4.5 0-2.4-1.7-4.1-4-4.1-.6 0-1.1.1-1.6.3.4-1.7 1.8-3.4 4.1-5.1L25.5 8Z" />
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

function UsersIcon() {
  return (
    <svg className="h-4 w-4 text-brand-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5 7c0-3-2-5-5-5s-5 2-5 5m12-7.2a2.5 2.5 0 0 0 0-4.6m3 11.8c0-2.4-1.4-4.1-3.6-4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="h-4 w-4 text-brand-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 8h14v9H3V8Zm7 0v9M2.5 5.5h15V8h-15V5.5ZM7.4 5.5C5 5.5 4.2 3 5.8 2.4c1.4-.5 2.9 1.1 4.2 3.1m2.6 0c2.4 0 3.2-2.5 1.6-3.1-1.4-.5-2.9 1.1-4.2 3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
