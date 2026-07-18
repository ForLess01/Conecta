import type { SVGProps } from "react";
import type { ProductCategory } from "@/types/domain";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function PapaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M8 5c-2.8.6-4.5 3-4 6 .3 2 .2 4 1.5 5.6C7 18.4 9 19 11.5 19c3 0 5.7-1.4 6.8-4 1-2.4.4-5-1.3-6.7C15.6 6.9 13 6 10.8 5.2 9.9 4.8 8.9 4.8 8 5Z" />
      <circle cx="9.5" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="13" cy="13" r="0.6" fill="currentColor" />
      <circle cx="10.5" cy="15" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function AlpacaFiberIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 3c-2 0-3 1.6-3 3 0 1 .4 1.6 1 2-1.4.6-2.4 2-2.4 3.6 0 1 .4 1.8 1 2.4-1 .5-1.6 1.6-1.6 2.8C7 19.2 8.8 21 11 21h2c2.2 0 4-1.8 4-4 0-1.2-.6-2.3-1.6-2.8.6-.6 1-1.4 1-2.4 0-1.6-1-3-2.4-3.6.6-.4 1-1 1-2 0-1.4-1-3-3-3Z" />
    </svg>
  );
}

export function QuinuaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 2v20" />
      <path d="M12 5c-2 0-3.5 1.2-3.5 2.6S10 10 12 10s3.5-1.1 3.5-2.4S14 5 12 5Z" />
      <path d="M12 10c-2.2 0-4 1.3-4 2.9s1.8 2.7 4 2.7 4-1.1 4-2.7-1.8-2.9-4-2.9Z" />
      <path d="M12 15.6c-1.8 0-3.2 1-3.2 2.3s1.4 2.1 3.2 2.1 3.2-.9 3.2-2.1-1.4-2.3-3.2-2.3Z" />
    </svg>
  );
}

export function CebollaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 3v2.5" />
      <path d="M12 5.5c-3.6 0-6 3.2-6 7.2 0 3.7 2.5 6.8 6 8.3 3.5-1.5 6-4.6 6-8.3 0-4-2.4-7.2-6-7.2Z" />
      <path d="M9.2 8.6c1 3.5 1 8.6 0 12" />
      <path d="M14.8 8.6c-1 3.5-1 8.6 0 12" />
    </svg>
  );
}

export function TruchaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M3 12c3-4 7-6 11-6 3 0 5.5 2 7 4-1.5 2-4 4-7 4-4 0-8-2-11-6" />
      <path d="M21 10l1.5 2-1.5 2" />
      <circle cx="8" cy="11" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function TransporteIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M3 16V8a1 1 0 0 1 1-1h9v9" />
      <path d="M13 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </svg>
  );
}

export function RutaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8c0 5 6 3 6 8" strokeDasharray="2 2" />
      <path d="M12 16c0-5 6-3 6-8" />
    </svg>
  );
}

export function RiesgoIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function OfertaIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 12V6a2 2 0 0 1 2-2h6l8 8-8 8-8-8Z" />
      <circle cx="9" cy="8" r="1.4" />
    </svg>
  );
}

export function NegociacionIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M14 9h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2l-2.5-2H10" opacity="0.55" />
    </svg>
  );
}

export const CATEGORY_ICONS: Record<ProductCategory, (props: IconProps) => React.JSX.Element> = {
  papa: PapaIcon,
  fibra_alpaca: AlpacaFiberIcon,
  quinua: QuinuaIcon,
  cebolla: CebollaIcon,
  trucha: TruchaIcon,
};

export function CategoryIcon({ category, ...props }: IconProps & { category: ProductCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon {...props} />;
}
