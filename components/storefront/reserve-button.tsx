import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { ROUTES } from "@/constants/routes";

/** Deep-links into the Reservation flow with this product pre-selected (Phase 5 "Reserve Button" → Phase 6 flow). */
export function ReserveButton({
  productSlug,
  className,
}: {
  productSlug: string;
  className?: string;
}) {
  return (
    <Magnetic className={className}>
      <Button
        size="lg"
        variant="gold"
        className="w-full"
        nativeButton={false}
        render={
          <Link href={`${ROUTES.reservation}?product=${productSlug}`}>
            <CalendarCheck className="size-4" />
            Reserve This Piece
          </Link>
        }
      />
    </Magnetic>
  );
}
