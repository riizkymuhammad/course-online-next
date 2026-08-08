import Image from "next/image";

type BrandLogoProps = {
  collapsed?: boolean;
  textClassName?: string;
};

export default function BrandLogo({
  collapsed = false,
  textClassName = "text-gray-900",
}: BrandLogoProps) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-theme-sm">
        <Image
          src="/images/logo/learning-with-rizky-mark.png"
          alt=""
          fill
          sizes="32px"
          className="scale-[1.14] object-cover"
        />
      </span>
      {!collapsed ? (
        <span className={`flex flex-col font-semibold tracking-tight ${textClassName}`}>
          <span className="text-xs leading-3 text-brand-500 dark:text-brand-400">Learning</span>
          <span className="text-[7px] font-medium leading-2 text-brand-600 dark:text-brand-500">With</span>
          <span className="text-xs leading-3 text-brand-700 dark:text-brand-300">Rizky</span>
        </span>
      ) : null}
    </span>
  );
}
