# Design Document

Dokumen ini menjelaskan desain produk dan teknis project `course-online-next` berdasarkan kode yang ada pada 2026-06-07.

## Ringkasan Produk

Course Online adalah platform belajar online dengan tiga pilar utama:

- Learning Path: jalur belajar berdasarkan kategori, sub kategori, dan sub sub kategori.
- Materi/Course: konten belajar yang terkait ke learning path.
- Tryout: latihan evaluasi, termasuk generate soal dari PDF menggunakan AI, pengerjaan user, scoring, dan riwayat hasil.

Target utama aplikasi:

- Guest dapat melihat landing page, daftar tryout, detail tryout, login, dan register.
- User dapat masuk ke `/app`, mengakses tryout, mengerjakan soal, melihat hasil, dan melihat riwayat.
- Admin dapat masuk ke `/dashboard`, mengelola learning path, course, quiz, tryout, dan melihat riwayat tryout semua user.

## Stack

- Framework: Next.js `16.2.4` dengan App Router.
- React: `19.2.4`.
- Styling: Tailwind CSS 4 dengan token di `app/globals.css`.
- Auth dan database: Supabase SSR dan Supabase JS.
- AI: AI SDK `ai` dengan provider `@ai-sdk/google`, model `gemini-2.5-flash`.
- Chart/template admin: ApexCharts, React ApexCharts, TailAdmin-style components.
- Storage: Supabase Storage bucket `tryout-thumbnails`.

Catatan Next.js 16:

- `proxy.ts` dipakai sebagai pengganti middleware untuk redirect awal.
- Pages dan layouts di `app` default sebagai Server Components.
- Komponen interaktif memakai `"use client"`.
- `params` dan `searchParams` pada page bertipe Promise melalui helper `PageProps`.
- Route Handler berada di `app/api/**/route.ts`.

## Struktur Aplikasi

Folder utama:

- `app`: route App Router, pages, layouts, route handlers.
- `components`: komponen UI dan feature components.
- `layout`: shell, sidebar, header, dan admin layout.
- `context`: Theme dan Sidebar context client-side.
- `lib`: helper domain, Supabase client, role, tryout, thumbnail, dan attempts.
- `public`: logo, hero images, product images, dan asset static.
- `supabase/migrations`: migrasi database dan storage yang ada.

Route penting:

- `/`: landing page.
- `/login`, `/signin`: login.
- `/register`, `/signup`: register.
- `/auth/callback`: callback Supabase OAuth.
- `/app`: dashboard user.
- `/app/history-tryout`: riwayat tryout user.
- `/dashboard`: dashboard admin.
- `/dashboard/learning-path`: learning path management.
- `/dashboard/course-management`: course management.
- `/dashboard/quiz-management`: quiz management.
- `/dashboard/tryout-management`: tryout management.
- `/dashboard/riwayat-tryout`: riwayat tryout semua user.
- `/tryouts`: daftar tryout publik.
- `/tryout/[uuid]/[slug]`: detail tryout.
- `/tryout/exam/[uuid]/[slug]`: pengerjaan tryout.
- `/tryout/result/[uuid]/[slug]/[attemptId]`: hasil tryout.

## Arsitektur Rendering

Server Components dipakai untuk:

- Fetch data Supabase pada landing page, dashboard pages, detail tryout, exam bootstrap, result, dan history.
- Redirect berdasarkan auth dengan `redirect()` dan not found dengan `notFound()`.
- Menghindari exposure credential Supabase server dan service role ke client.

Client Components dipakai untuk:

- Form login/register.
- Google OAuth button.
- User dropdown, role switch, logout.
- Header, sidebar, theme toggle.
- DataTable search/sort/pagination.
- Hero slider dan learning path carousel.
- Create tryout form dengan upload PDF dan progress status.
- Tryout exam client untuk navigasi soal, autosave jawaban, dan submit.

Mutasi data memakai dua pola:

- Server Actions untuk form admin sederhana seperti create learning path dan update tryout.
- Route Handlers untuk proses API yang butuh fetch client-side, JSON, file upload, atau AI generation.

## Auth dan Role

Supabase menjadi sumber session. Helper role berada di `lib/auth-roles.ts`.

Role yang dikenal:

- `user`
- `admin`

Admin terdeteksi dari `user.app_metadata`:

- `role`
- `user_role`
- `roles`
- `is_admin`

Cookie `course_online_active_role` menyimpan mode aktif. Admin bisa switch mode antara admin dan user melalui `UserDropdown`, lalu `/api/auth/active-role` mengatur cookie dan redirect target.

Redirect utama:

- User biasa setelah login diarahkan ke `/app`.
- Admin setelah login diarahkan ke `/dashboard`.
- User yang mencoba `/dashboard` diarahkan ke `/app`.
- Admin yang aktif sebagai admin dan mencoba `/app` diarahkan ke `/dashboard`.

Security principle:

- `proxy.ts` hanya untuk redirect awal.
- Server Actions dan Route Handlers tetap harus memverifikasi auth dan role sendiri.
- RLS Supabase tetap wajib untuk tabel sensitif.

## Data Model

Bagian ini menggabungkan schema yang ada di migrasi dan kolom yang sudah dipakai oleh query kode.

### learning_paths

Kolom yang dipakai:

- `id`
- `title`
- `slug`
- `description`
- `category`
- `sub_category`
- `sub_sub_category`
- `status`
- `created_at`
- `updated_at`

Fungsi:

- Menjadi hirarki kategori dan label untuk course/tryout.
- Ditampilkan di landing page, daftar tryout, create tryout, dan management admin.

### courses

Kolom yang dipakai atau diharapkan UI:

- `id`
- `learning_path_id`
- `title`
- `slug`
- `description`
- `thumbnail`
- `section_count`
- `module_count`
- `presenter`
- `price`
- `is_free`
- `source_file`
- `ai_generated_summary`
- `status`
- `created_at`
- `updated_at`

Fungsi:

- Materi belajar dalam learning path.
- Saat ini landing page membaca data Supabase, sementara admin course management masih memakai data static.

### course_progress

Kolom yang dipakai:

- `id`
- `user_id`
- `course_id`
- `status`
- `completed_at`
- `updated_at`

Fungsi:

- Menentukan materi terakhir di `/app`.

### tryouts

Kolom yang dipakai:

- `id`
- `learning_path_id`
- `title`
- `total_questions`
- `question_notes`
- `thumbnail_url`
- `thumbnail_path`
- `material_file_url`
- `material_file_name`
- `material_file_type`
- `material_file_size`
- `ai_generation_status`
- `ai_generation_notes`
- `status`
- `updated_at`

Fungsi:

- Metadata tryout yang muncul di admin, landing page, daftar publik, detail, exam, result, dan history.

### tryout_questions

Kolom yang dipakai:

- `id`
- `tryout_id`
- `question_order`
- `question`
- `explanation`
- `correct_option_id`

Fungsi:

- Soal tryout hasil generate AI atau input manual.

### tryout_question_options

Kolom yang dipakai:

- `id`
- `tryout_question_id`
- `option_order`
- `option_text`

Fungsi:

- Opsi jawaban untuk soal pilihan ganda.

### tryout_attempts

Didefinisikan di migrasi `20260428_create_tryout_attempt_tables.sql`.

Kolom utama:

- `id`
- `tryout_id`
- `user_id`
- `status`
- `started_at`
- `submitted_at`
- `graded_at`
- `total_questions`
- `answered_questions`
- `correct_answers`
- `wrong_answers`
- `unanswered_answers`
- `score`
- `max_score`
- `duration_seconds`
- `created_at`
- `updated_at`

Status valid:

- `in_progress`
- `submitted`
- `graded`
- `cancelled`

### tryout_attempt_answers

Didefinisikan di migrasi `20260428_create_tryout_attempt_tables.sql`.

Kolom utama:

- `id`
- `attempt_id`
- `tryout_id`
- `tryout_question_id`
- `selected_option_id`
- `is_correct`
- `answered_at`
- `created_at`
- `updated_at`

Constraint penting:

- Unique pada `attempt_id, tryout_question_id`.

### Storage

Bucket:

- `tryout-thumbnails`

Fungsi:

- Menyimpan SVG thumbnail tryout yang dibuat otomatis dari judul tryout.

Policy:

- Public dapat melihat thumbnail.
- Authenticated dapat upload/update thumbnail.

## Flow Utama

### Landing Page

File: `app/page.tsx`

Flow:

1. Server Component membuat Supabase server client.
2. Fetch user, learning path published, tryout published, dan course published secara paralel.
3. Role aktif dibaca dari cookie.
4. Data disusun menjadi hero, learning path carousel, material cards, dan tryout cards.
5. Bila data kosong, learning path memakai fallback item.

### Login dan Register

File:

- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`
- `components/auth/GoogleAuthButton.tsx`
- `app/auth/callback/route.ts`

Flow login email/password:

1. Client form memanggil `supabase.auth.signInWithPassword`.
2. Cookie role aktif direset via `DELETE /api/auth/active-role`.
3. User diarahkan berdasarkan role dan `redirectedFrom`.

Flow register:

1. Client form memvalidasi password confirmation.
2. `supabase.auth.signUp` dipanggil dengan metadata `role: "user"`.
3. UI menampilkan pesan sukses dan kemungkinan email confirmation.

Flow Google:

1. Client memanggil `signInWithOAuth`.
2. Callback `/auth/callback` exchange code menjadi session.
3. Role dibaca dan cookie role aktif diset.
4. User diarahkan ke tujuan aman.

### Admin Create Learning Path

File:

- `app/(admin)/dashboard/learning-path/create/page.tsx`
- `app/(admin)/dashboard/learning-path/create/actions.ts`

Flow:

1. Admin mengisi title, kategori, deskripsi, dan status.
2. Server Action membuat slug dari title.
3. Row disimpan ke `learning_paths`.
4. `revalidatePath("/dashboard/learning-path")`.
5. Redirect ke list dengan query `created=1`.

### Admin Generate Tryout

File:

- `components/tryout/CreateTryoutForm.tsx`
- `app/api/tryout/generate/route.ts`
- `lib/tryout-thumbnail.ts`

Flow:

1. Client form mengirim `FormData` ke `/api/tryout/generate`.
2. Route Handler memvalidasi env `GOOGLE_GENERATIVE_AI_API_KEY`.
3. Input wajib divalidasi: title, learning path, status, question count, PDF.
4. Learning path diambil dari Supabase.
5. PDF dikonversi ke data URL base64.
6. AI SDK memanggil Gemini untuk menghasilkan object terstruktur berdasarkan Zod schema.
7. Thumbnail SVG dibuat dan diupload ke bucket `tryout-thumbnails`.
8. Row `tryouts` dibuat.
9. Setiap question disimpan ke `tryout_questions`.
10. Options disimpan ke `tryout_question_options`.
11. Correct option dicocokkan dari jawaban AI dan disimpan di `correct_option_id`.
12. Client menampilkan status proses, lalu redirect ke `/dashboard/tryout-management`.

### User Mengerjakan Tryout

File:

- `app/tryout/[uuid]/[slug]/page.tsx`
- `app/tryout/exam/[uuid]/[slug]/page.tsx`
- `components/tryout/TryoutExamClient.tsx`
- `app/api/tryout/attempts/save-answer/route.ts`
- `app/api/tryout/attempts/submit/route.ts`

Flow:

1. User membuka detail tryout.
2. Bila belum login, tombol mulai mengarah ke login dengan `redirectedFrom`.
3. Halaman exam memverifikasi user.
4. Slug canonical divalidasi.
5. Questions dan options diambil dari Supabase.
6. `findOrCreateInProgressAttempt` mencari attempt aktif atau membuat attempt baru.
7. Initial answers diambil dari `tryout_attempt_answers`.
8. Client menampilkan soal, peta soal, dan pilihan jawaban.
9. Setiap pilihan jawaban diupsert ke `tryout_attempt_answers`.
10. Submit memverifikasi semua soal sudah dijawab.
11. Server menghitung benar/salah berdasarkan `correct_option_id`.
12. Attempt diupdate menjadi `graded`.
13. User diarahkan ke halaman result.

### Result dan History

File:

- `app/tryout/result/[uuid]/[slug]/[attemptId]/page.tsx`
- `app/app/history-tryout/page.tsx`
- `app/(admin)/dashboard/riwayat-tryout/page.tsx`

User result:

- Menampilkan score, benar, salah, tidak dijawab, durasi, total soal, submitted time, dan accuracy.

User history:

- Menampilkan attempt user yang berstatus `submitted` atau `graded`.

Admin history:

- Mencoba RPC `get_tryout_attempt_history()`.
- Bila RPC tidak tersedia, fallback ke query langsung `tryout_attempts`.
- Bila service role tersedia, nama user diambil dari Supabase Auth admin API.

## UI dan Design System

Bahasa visual:

- Clean dashboard interface dengan pola TailAdmin.
- Palet utama biru brand `#465fff`.
- Status:
  - success untuk published/sukses/score tinggi.
  - warning untuk draft/score sedang.
  - error untuk gagal/score rendah.
  - gray untuk archived/neutral.
- Font global: Outfit via `next/font/google`.
- Dark mode memakai class `dark` pada `documentElement`.

Komponen umum:

- `DataTable`: search, sort, pagination, badge, image text, dan action button.
- `PageBreadcrumb`: konteks halaman admin.
- `StatusAlert`: feedback sukses/error/warning.
- `AppHeader`: header dashboard dan user app.
- `AppSidebar`: navigasi admin.
- `UserDropdown`: profile, role switch, dan sign out.

Responsive:

- Breakpoint mengikuti token Tailwind di `globals.css`.
- Admin sidebar collapse pada desktop dan off-canvas pada mobile.
- Landing page dan app page memakai grid yang turun menjadi single column di mobile.

## Integrasi Eksternal

Supabase:

- Session cookies lewat `@supabase/ssr`.
- Browser client hanya memakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Admin client memakai `SUPABASE_SERVICE_ROLE_KEY`, hanya di server.

Google Gemini:

- Digunakan di `/api/tryout/generate`.
- Membaca PDF melalui AI SDK file input.
- Output divalidasi dengan Zod schema.

Next Image:

- Supabase image host diizinkan lewat `next.config.ts`.
- SVG thumbnail generated dipakai dengan `unoptimized` pada beberapa komponen.

## Environment Variables

Contoh di `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Keterbatasan Saat Ini

- Base schema tabel utama belum ada di migrasi repo.
- Course management masih static.
- Quiz management masih static.
- Dashboard utama masih memakai widget ecommerce template.
- Route generate tryout belum terlihat memiliki explicit admin role check.
- Server Action create/update admin belum terlihat memiliki explicit admin role check.
- AI schema mengizinkan tipe soal non pilihan ganda, tetapi UI exam hanya mendukung pilihan opsi.
- Generate tryout belum memakai transaksi database atomik.
- PDF materi belum disimpan sebagai file permanen, hanya metadata yang disimpan.
- Result page belum menampilkan pembahasan per soal.
- Beberapa menu sidebar masih bawaan template dan belum punya route nyata.

## Prinsip Implementasi Lanjutan

- Ikuti pola App Router Next.js 16 yang sudah dipakai project.
- Fetch data sensitif di Server Components atau server-only modules.
- Beri `"use client"` hanya pada komponen yang butuh state, event handler, effect, browser API, atau context.
- Mutasi harus selalu memverifikasi auth dan role di server.
- Revalidate route yang terdampak setelah Server Action atau mutasi.
- Tambahkan migrasi untuk setiap perubahan schema.
- Jangan menaruh secret di client component.
- Gunakan helper domain yang sudah ada sebelum membuat helper baru.
