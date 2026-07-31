import Surface from "@/components/atoms/Surface";

type SummaryCardProps = {
  label: string;
  value: string;
  note: string;
};

export default function SummaryCard({ label, value, note }: SummaryCardProps) {
  return (
    <Surface as="article" className="p-5 sm:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-800 dark:text-white/90">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>
    </Surface>
  );
}
