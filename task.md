# Task Roadmap

Dokumen ini disusun dari kondisi project `course-online-next` pada 2026-06-07. Fokusnya adalah membuat backlog yang bisa dipakai untuk melanjutkan pengembangan platform Course Online berbasis Next.js 16 App Router, Supabase, Tailwind CSS 4, dan AI SDK.

## Status Saat Ini

- Landing page sudah menampilkan hero, learning path, materi, tryout, dan CTA dari data Supabase bila tersedia.
- Auth sudah memakai Supabase email/password dan Google OAuth.
- Role routing sudah memakai `proxy.ts` Next 16 untuk memisahkan `/dashboard` admin dan `/app` user.
- Learning path admin sudah tersambung ke Supabase untuk list dan create.
- Tryout admin sudah tersambung ke Supabase untuk list, create dengan AI, dan edit metadata.
- User sudah bisa membuka daftar tryout, detail tryout, mengerjakan soal, autosave jawaban, submit, melihat hasil, dan melihat riwayat.
- Course management, quiz management, dan dashboard analytics masih banyak memakai data contoh/static.
- Migrasi Supabase yang ada baru mencakup tryout attempt, history function, thumbnail storage, dan kolom kategori learning path. Schema awal tabel utama masih perlu dibakukan.

## Prioritas P0

### Keamanan Auth dan Authorization

- [ ] Tambahkan guard admin di setiap Server Action dan Route Handler admin, terutama `createLearningPath`, `updateTryout`, dan `/api/tryout/generate`.
- [ ] Jangan mengandalkan `proxy.ts` sebagai satu-satunya proteksi. Proxy hanya optimistic route redirect, sementara mutasi data harus memverifikasi user dan role di server.
- [ ] Pastikan RLS Supabase tersedia untuk tabel `learning_paths`, `courses`, `tryouts`, `tryout_questions`, dan `tryout_question_options`.
- [ ] Audit penggunaan `SUPABASE_SERVICE_ROLE_KEY`; pastikan hanya dipakai di server dan tidak pernah masuk client bundle.
- [ ] Tambahkan handling 401/403 yang konsisten untuk API internal.

### Database dan Migrasi Dasar

- [ ] Buat migrasi baseline untuk tabel inti yang belum ada di repo:
  - `learning_paths`
  - `courses`
  - `course_progress`
  - `tryouts`
  - `tryout_questions`
  - `tryout_question_options`
- [ ] Tambahkan constraint status untuk `draft`, `published`, dan `archived`.
- [ ] Tambahkan foreign key dan index untuk relasi learning path, course, tryout, questions, options, dan progress user.
- [ ] Samakan nama kolom dengan query yang sudah dipakai di kode.
- [ ] Dokumentasikan seed minimal untuk admin, learning path, course, dan tryout contoh.

### Stabilitas Generate Tryout AI

- [ ] Validasi agar jumlah soal yang disimpan sama dengan `question_count`.
- [ ] Batasi output AI ke multiple choice bila UI exam hanya mendukung pilihan ganda.
- [ ] Tolak atau transform output non multiple-choice seperti essay, short-answer, dan true-false sebelum disimpan.
- [ ] Buat mekanisme cleanup bila proses insert soal/options gagal di tengah jalan.
- [ ] Simpan file PDF materi ke Supabase Storage atau jelaskan dengan jelas bahwa file hanya dipakai saat generate.
- [ ] Tambahkan status AI yang lebih detail: `pending`, `generating`, `completed`, `failed`.

## Prioritas P1

### Master Data Kategori dan Sub Kategori

Asumsi data:

- Tabel `categories` berisi `id` dan `name`.
- Tabel `sub_categories` berisi `id`, `category_id`, dan `name`.
- Field kategori pada form sub kategori diambil dari tabel `categories`.

#### Database

- [x] Buat migrasi tabel `categories`.
- [x] Tambahkan kolom `id uuid primary key default gen_random_uuid()` pada `categories`.
- [x] Tambahkan kolom `name text not null` pada `categories`.
- [x] Tambahkan kolom `created_at timestamptz not null default now()` pada `categories`.
- [x] Tambahkan kolom `updated_at timestamptz not null default now()` pada `categories`.
- [x] Tambahkan unique constraint untuk `categories.name`.
- [x] Buat index untuk `categories.name`.
- [x] Aktifkan RLS untuk `categories`.
- [x] Buat policy select `categories` untuk authenticated user.
- [x] Buat policy insert/update/delete `categories` khusus admin.
- [x] Buat migrasi tabel `sub_categories`.
- [x] Tambahkan kolom `id uuid primary key default gen_random_uuid()` pada `sub_categories`.
- [x] Tambahkan kolom `category_id uuid not null references categories(id)` pada `sub_categories`.
- [x] Tambahkan kolom `name text not null` pada `sub_categories`.
- [x] Tambahkan kolom `created_at timestamptz not null default now()` pada `sub_categories`.
- [x] Tambahkan kolom `updated_at timestamptz not null default now()` pada `sub_categories`.
- [x] Tambahkan unique constraint untuk kombinasi `category_id` dan `name`.
- [x] Buat index untuk `sub_categories.category_id`.
- [x] Buat index untuk `sub_categories.name`.
- [x] Aktifkan RLS untuk `sub_categories`.
- [x] Buat policy select `sub_categories` untuk authenticated user.
- [x] Buat policy insert/update/delete `sub_categories` khusus admin.
- [x] Pastikan trigger `updated_at` berjalan untuk dua tabel master data.

#### Navigasi Admin

- [x] Tambahkan menu parent `Master Data` di `AppSidebar`.
- [x] Tambahkan submenu `Kategori` dengan route `/dashboard/master-data/kategori`.
- [x] Tambahkan submenu `Sub Kategori` dengan route `/dashboard/master-data/sub-kategori`.
- [x] Pastikan menu aktif mengikuti pathname halaman kategori.
- [x] Pastikan submenu tetap terbuka saat berada di route master data.
- [ ] Hapus atau abaikan menu template yang tidak dipakai bila mengganggu navigasi.

#### Halaman Kategori

- [x] Buat folder route `/dashboard/master-data/kategori`.
- [x] Buat page kategori sebagai Server Component.
- [x] Tambahkan breadcrumb `Dashboard / Master Data / Kategori`.
- [x] Query data dari tabel `categories`.
- [x] Query jumlah sub kategori per kategori.
- [x] Tampilkan tabel dengan kolom `ID`, `Kategori`, dan `Jumlah Sub Kategori`.
- [x] Tambahkan tombol `Tambah Kategori`.
- [x] Tambahkan tombol `Tambah Sub Kategori`.
- [x] Buat empty state saat kategori belum ada.
- [x] Buat state sukses setelah tambah kategori.
- [x] Buat state sukses setelah tambah sub kategori.
- [x] Buat state error saat query kategori gagal.

#### Tambah Kategori

- [x] Buat route `/dashboard/master-data/kategori/create`.
- [x] Buat form tambah kategori.
- [x] Tambahkan field `Kategori`.
- [x] Jadikan field `Kategori` wajib.
- [x] Tambahkan tombol `Cancel`.
- [x] Tambahkan tombol `Save Kategori`.
- [x] Buat Server Action `createCategory`.
- [x] Validasi nama kategori tidak kosong di server.
- [x] Trim input kategori sebelum disimpan.
- [x] Simpan kategori ke tabel `categories`.
- [x] Tangani error duplicate kategori.
- [x] Jalankan `revalidatePath("/dashboard/master-data/kategori")`.
- [x] Redirect ke halaman kategori dengan query sukses.

#### Tambah Sub Kategori dari Menu Kategori

- [x] Buat route `/dashboard/master-data/kategori/sub-kategori/create`.
- [x] Buat form tambah sub kategori dari halaman kategori.
- [x] Query daftar kategori untuk dropdown.
- [x] Tambahkan field dropdown `Kategori`.
- [x] Ambil opsi dropdown dari tabel `categories`.
- [x] Jadikan dropdown `Kategori` wajib.
- [x] Tambahkan field `Sub Kategori`.
- [x] Jadikan field `Sub Kategori` wajib.
- [x] Tambahkan tombol `Cancel`.
- [x] Tambahkan tombol `Save Sub Kategori`.
- [x] Buat Server Action `createSubCategory`.
- [x] Validasi kategori dipilih di server.
- [x] Validasi sub kategori tidak kosong di server.
- [x] Trim input sub kategori sebelum disimpan.
- [x] Simpan sub kategori ke tabel `sub_categories`.
- [x] Tangani error duplicate sub kategori dalam kategori yang sama.
- [x] Jalankan `revalidatePath("/dashboard/master-data/kategori")`.
- [x] Jalankan `revalidatePath("/dashboard/master-data/sub-kategori")`.
- [x] Redirect ke halaman kategori dengan query sukses.

#### Halaman Sub Kategori

- [x] Buat folder route `/dashboard/master-data/sub-kategori`.
- [x] Buat page sub kategori sebagai Server Component.
- [x] Tambahkan breadcrumb `Dashboard / Master Data / Sub Kategori`.
- [x] Query data dari tabel `sub_categories`.
- [x] Join atau fetch nama kategori dari tabel `categories`.
- [x] Tampilkan tabel dengan kolom `ID`, `Kategori`, dan `Sub Kategori`.
- [x] Tambahkan tombol `Tambah Sub Kategori`.
- [x] Buat empty state saat sub kategori belum ada.
- [x] Buat state sukses setelah tambah sub kategori.
- [x] Buat state error saat query sub kategori gagal.

#### Tambah Sub Kategori dari Menu Sub Kategori

- [x] Buat route `/dashboard/master-data/sub-kategori/create`.
- [x] Buat form tambah sub kategori.
- [x] Query daftar kategori dari tabel `categories`.
- [x] Tambahkan field dropdown `Kategori`.
- [x] Isi dropdown `Kategori` dari tabel `categories`.
- [x] Tampilkan pesan bila belum ada kategori.
- [x] Disable tombol simpan bila belum ada kategori.
- [x] Tambahkan field `Sub Kategori`.
- [x] Jadikan field `Sub Kategori` wajib.
- [x] Tambahkan tombol `Cancel`.
- [x] Tambahkan tombol `Save Sub Kategori`.
- [x] Pakai Server Action `createSubCategory` yang sama bila memungkinkan.
- [x] Redirect ke halaman sub kategori dengan query sukses.

#### Edit dan Delete

- [ ] Tambahkan action `Edit` pada tabel kategori.
- [ ] Buat route edit kategori.
- [ ] Buat Server Action `updateCategory`.
- [ ] Tambahkan action `Delete` pada tabel kategori.
- [ ] Cegah delete kategori yang masih memiliki sub kategori.
- [ ] Tambahkan action `Edit` pada tabel sub kategori.
- [ ] Buat route edit sub kategori.
- [ ] Buat Server Action `updateSubCategory`.
- [ ] Tambahkan action `Delete` pada tabel sub kategori.
- [ ] Buat konfirmasi sebelum delete kategori dan sub kategori.

#### Integrasi Form Tryout

- [x] Ganti input teks `Kategori` pada create tryout menjadi dropdown dari tabel `categories`.
- [x] Ganti input teks `Sub Kategori` pada create tryout menjadi dropdown dari tabel `sub_categories`.
- [x] Filter dropdown sub kategori berdasarkan kategori yang dipilih.
- [x] Tetap izinkan learning path kosong.
- [x] Tetap izinkan kategori kosong.
- [x] Tetap izinkan sub kategori kosong.
- [ ] Simpan `category_id` dan `sub_category_id` pada tabel `tryouts` bila schema sudah siap.
- [ ] Tampilkan nama kategori dan sub kategori pada list tryout.

#### Verifikasi

- [x] Jalankan `npm run build`.
- [ ] Test manual tambah kategori.
- [ ] Test manual tambah sub kategori dari menu kategori.
- [ ] Test manual tambah sub kategori dari menu sub kategori.
- [ ] Test manual dropdown kategori di form sub kategori.
- [ ] Test manual duplicate kategori.
- [ ] Test manual duplicate sub kategori pada kategori yang sama.
- [ ] Test manual create tryout tanpa learning path.
- [ ] Test manual create tryout dengan kategori dan sub kategori.

### Course Management

- [ ] Ganti data static di `/dashboard/course-management` dengan query Supabase.
- [ ] Implement create course yang menyimpan ke tabel `courses`.
- [ ] Tambahkan edit, detail, archive/publish, dan delete course.
- [ ] Sambungkan pilihan learning path dari tabel `learning_paths`.
- [ ] Tambahkan upload thumbnail atau source file course bila fitur materi perlu file.
- [ ] Buat halaman user untuk melihat detail course dan menyelesaikan modul.
- [ ] Update `course_progress` saat user mulai atau menyelesaikan materi.

### Quiz Management

- [ ] Ganti data static di `/dashboard/quiz-management` dengan data Supabase.
- [ ] Definisikan schema quiz, quiz questions, dan quiz options bila fitur quiz tetap dipisah dari tryout.
- [ ] Implement create/edit/detail/publish quiz.
- [ ] Tentukan hubungan quiz dengan course section/module.
- [ ] Tambahkan UI pengerjaan quiz atau satukan dengan engine tryout bila konsepnya sama.

### Learning Path Management

- [ ] Hitung `material_count` dari tabel `courses`, bukan nilai `0`.
- [ ] Tambahkan edit learning path.
- [ ] Tambahkan archive/publish dan delete dengan validasi relasi course/tryout.
- [ ] Buat detail learning path untuk admin.
- [ ] Buat halaman public/user untuk melihat materi dan tryout dalam satu learning path.

### Tryout Management

- [ ] Tambahkan delete/archive tryout dari admin.
- [ ] Tambahkan detail admin yang menampilkan daftar soal dan opsi jawaban.
- [ ] Tambahkan fitur regenerate soal dengan konfirmasi.
- [ ] Tambahkan edit soal dan opsi manual setelah generate AI.
- [ ] Tambahkan validasi title/slug dan duplicate handling yang konsisten.
- [ ] Tampilkan `ai_generation_status` di tabel management.

## Prioritas P2

### User Experience Tryout

- [ ] Tambahkan timer atau durasi opsional per tryout.
- [ ] Tambahkan fitur resume attempt yang masih `in_progress`.
- [ ] Tambahkan tombol batalkan attempt.
- [ ] Tampilkan review jawaban per soal di halaman result.
- [ ] Tampilkan pembahasan dari kolom `explanation`.
- [ ] Tentukan aturan retake: unlimited, limited, atau hanya setelah attempt selesai.
- [ ] Tambahkan empty state yang konsisten untuk tryout tanpa soal.

### Dashboard Analytics

- [ ] Ganti widget TailAdmin ecommerce dengan metrik Course Online:
  - total user
  - total learning path
  - total course
  - total tryout
  - attempt selesai
  - rata-rata skor
  - performa per learning path
- [ ] Ganti chart sales/orders dengan chart progres belajar dan tryout.
- [ ] Hapus menu template yang belum dipakai seperti Calendar, User Profile dummy, Forms, Tables, Pages, Charts, dan UI Elements bila tidak masuk scope.

### Auth dan Account

- [ ] Implement forgot password.
- [ ] Tambahkan halaman profile/account settings yang nyata.
- [ ] Tambahkan UX email confirmation untuk register.
- [ ] Buat mekanisme assignment admin role yang aman.
- [ ] Rapikan copy campuran Indonesia/Inggris di login/register.

## Prioritas P3

### Quality dan Testing

- [ ] Tambahkan unit test helper `auth-roles`, `learning-path`, `tryout`, dan `tryout-thumbnail`.
- [ ] Tambahkan test Route Handler untuk save answer dan submit attempt.
- [ ] Tambahkan integration test untuk generate tryout dengan mock AI.
- [ ] Tambahkan E2E flow:
  - register/login
  - admin create learning path
  - admin create tryout
  - user kerjakan tryout
  - user lihat result/history
- [ ] Jalankan `npm run lint` dan `npm run build` sebelum release.

### Observability dan Operasional

- [ ] Tambahkan logging server untuk generate AI, submit tryout, dan error Supabase.
- [ ] Tambahkan error boundary untuk halaman dashboard, tryout, dan auth.
- [ ] Tambahkan loading UI untuk route dengan query lambat.
- [ ] Dokumentasikan env vars dan setup Supabase lokal/staging.
- [ ] Tambahkan README project yang spesifik, bukan README default Next.js.

## Definition of Done

Sebuah task dianggap selesai bila:

- Perubahan sudah mengikuti pola Next.js 16 App Router yang dipakai project.
- Auth dan authorization diverifikasi di server untuk operasi sensitif.
- Query Supabase punya error handling yang jelas.
- UI mobile dan desktop tetap rapi.
- Lint/build berhasil atau alasan gagal didokumentasikan.
- Bila mengubah schema, migrasi Supabase ikut ditambahkan.
- Bila mengubah flow user penting, minimal ada test atau checklist manual.
