import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UserTableRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  registered_at: string;
  last_sign_in: string;
};

export const metadata: Metadata = {
  title: "Manajemen User",
  description: "Daftar pengguna yang terdaftar pada platform.",
};

const roleStyles: Record<string, string> = {
  Admin: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Siswa: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
};

const statusStyles: Record<string, string> = {
  Aktif: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  "Belum konfirmasi": "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
};

function getMetadataName(metadata: unknown, fallback: string) {
  if (metadata && typeof metadata === "object") {
    const record = metadata as Record<string, unknown>;
    const fullName = typeof record.full_name === "string" ? record.full_name.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (fullName) return fullName;
    if (name) return name;
  }

  return fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function UserManagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/dashboard/user-management");
  }

  if (getUserRole(user) !== "admin") {
    redirect("/app");
  }

  const adminClient = createAdminClient();
  const { data: result, error } = adminClient
    ? await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    : { data: null, error: new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.") };
  const users = result?.users ?? [];
  const records: UserTableRow[] = users.map((registeredUser) => {
    const isAdmin = getUserRole(registeredUser) === "admin";
    const isConfirmed = Boolean(registeredUser.email_confirmed_at);

    return {
      id: registeredUser.id,
      name: getMetadataName(registeredUser.user_metadata, registeredUser.email ?? registeredUser.id),
      email: registeredUser.email ?? "-",
      role: isAdmin ? "Admin" : "Siswa",
      status: isConfirmed ? "Aktif" : "Belum konfirmasi",
      registered_at: formatDateTime(registeredUser.created_at),
      last_sign_in: formatDateTime(registeredUser.last_sign_in_at),
    };
  });
  const adminCount = records.filter((item) => item.role === "Admin").length;
  const activeCount = records.filter((item) => item.status === "Aktif").length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen User" },
        ]}
        title="Manajemen User"
        description="Lihat akun yang terdaftar, peran pengguna, status konfirmasi, dan aktivitas masuk terakhir."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <SummaryCard label="Total User" value={String(records.length)} note="Akun yang terdaftar" />
        <SummaryCard label="User Aktif" value={String(activeCount)} note="Email telah dikonfirmasi" />
        <SummaryCard label="Admin" value={String(adminCount)} note="Pengelola platform" />
      </section>

      {error ? (
        <StatusAlert
          variant="error"
          title="Data user belum dapat dimuat"
          message={error.message}
        />
      ) : null}

      <DataTable
        title="Daftar User Terdaftar"
        description="Data diambil dari akun autentikasi Supabase."
        searchPlaceholder="Cari nama atau email user..."
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        columns={[
          { key: "name", label: "Nama", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "role", label: "Peran", sortable: true, type: "badge", badgeToneMap: roleStyles },
          { key: "status", label: "Status", sortable: true, type: "badge", badgeToneMap: statusStyles },
          { key: "registered_at", label: "Terdaftar", sortable: true },
          { key: "last_sign_in", label: "Login Terakhir", sortable: true },
        ]}
        data={records}
      />
    </div>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </article>
  );
}
