import Image from "next/image";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className ?? ""}`}>
      <Image
        src="/momentum-data-mark.png"
        alt="Momentum Data Solutions"
        fill
        sizes="48px"
        className="object-contain dark:hidden"
        priority
      />
      <Image
        src="/momentum-data-mark-white.png"
        alt="Momentum Data Solutions"
        fill
        sizes="48px"
        className="hidden object-contain dark:block"
        priority
      />
    </span>
  );
}
