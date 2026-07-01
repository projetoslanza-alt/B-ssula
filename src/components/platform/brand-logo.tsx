import Link from "next/link";
import { cn } from "@/lib/utils";
import { platformRoutes } from "@/lib/routes";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link href={platformRoutes.home} className={cn("brand", className)}>
      <div className="brand-mark" aria-hidden />
      <div>
        <strong>Bússola</strong>
        <small>by VendasComCiência</small>
      </div>
    </Link>
  );
}
