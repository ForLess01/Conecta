import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "brand" | "mono" | "white";
}

/**
 * Programmatic isotype: a curved route connecting two nodes, resting on an
 * abstract leaf shape over a soft hexagonal territory. Pure SVG primitives
 * (path/circle/line), no raster assets, scales cleanly from 24px to 512px.
 */
export function Logo({ className, size = 32, variant = "brand" }: LogoProps) {
  const colors =
    variant === "white"
      ? { hex: "#FFFFFF33", route: "#FFFFFF", node: "#FFFFFF", leaf: "#FFFFFF66" }
      : variant === "mono"
      ? { hex: "#17212B22", route: "#17212B", node: "#17212B", leaf: "#17212B55" }
      : { hex: "#DDF5E9", route: "#0B6B4F", node: "#073F32", leaf: "#0B6B4F55" };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Conecta"
      className={cn("shrink-0", className)}
    >
      <path
        d="M24 2 L43 13 V35 L24 46 L5 35 V13 Z"
        fill={colors.hex}
      />
      <path
        d="M15 20 C19 12, 27 12, 31 18"
        stroke={colors.leaf}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 30 C18 33, 22 22, 28 24 C32 25.5, 33 29, 36 28"
        stroke={colors.route}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="30" r="3.2" fill={colors.node} />
      <circle cx="36" cy="28" r="3.2" fill={colors.node} />
      <line x1="12" y1="30" x2="12" y2="30" stroke={colors.node} strokeWidth="0" />
    </svg>
  );
}

export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return <Logo className={className} size={size} />;
}
