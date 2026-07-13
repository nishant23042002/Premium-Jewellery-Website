import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { formatDate } from "@/lib/utils/format";
import type { StoreEvent } from "@/features/events/event.types";

export function EventCard({ event }: { event: StoreEvent }) {
  const isUpcoming = new Date(event.date) >= new Date();

  return (
    <Card className="overflow-hidden border-border/60 py-0 shadow-sm">
      <div className="relative aspect-16/9">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title.en}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderImage
            seed={event.slug}
            icon={CalendarDays}
            className="h-full w-full"
          />
        )}
      </div>
      <CardContent className="space-y-2 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {formatDate(event.date)}
          </p>
          <Badge variant={isUpcoming ? "gold" : "secondary"}>
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
        <h3 className="font-heading text-lg">{event.title.en}</h3>
        <p className="text-sm text-muted-foreground">{event.description.en}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {event.location}
        </p>
      </CardContent>
    </Card>
  );
}
