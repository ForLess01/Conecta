import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  /**
   * The source PNG has a white (non-transparent) background. On dark or
   * colored surfaces render it inside a light rounded tile so the white
   * square never shows as a hard edge.
   */
  tile?: boolean;
}

export function BrandLogo({ size = 32, className, tile = false }: BrandLogoProps) {
  const doubledSize = size * 2;
  const image = (
    <Image
      src="/logo-conecta.png"
      alt="Conecta"
      width={doubledSize}
      height={doubledSize}
      className={cn("rounded-lg object-cover", !tile && className)}
      priority
    />
  );

  if (!tile) return image;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-sm",
        className
      )}
    >
      {image}
    </span>
  );
}
