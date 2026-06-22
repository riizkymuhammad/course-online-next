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
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-theme-sm">
        <Image
          src="/images/logo/logo-icon.svg"
          alt=""
          width={17}
          height={17}
          className="brightness-0 invert"
        />
      </span>
      {!collapsed ? (
        <span className={`text-sm font-bold tracking-normal ${textClassName}`}>
          Course<span className="text-brand-600">Online</span>
        </span>
      ) : null}
    </span>
  );
}
