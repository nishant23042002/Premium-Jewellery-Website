"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  Gem,
  MessageSquare,
  Package,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/audit-logs/audit-log.actions";
import type {
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationType,
} from "@/features/audit-logs/audit-log.actions";

const NOTIFICATION_ICON: Record<AdminNotificationType, typeof Bell> = {
  order_placed: Package,
  order_status_changed: Package,
  reservation_created: CalendarClock,
  reservation_status_changed: CalendarClock,
  enquiry_created: MessageSquare,
  customer_created: UserPlus,
  rate_updated: Gem,
  rate_fetch_failed: AlertTriangle,
};

const CATEGORY_TABS: { key: AdminNotificationCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "order", label: "Orders" },
  { key: "reservation", label: "Reservations" },
  { key: "enquiry", label: "Enquiries" },
  { key: "customer", label: "Customers" },
  { key: "rate", label: "Rates" },
];

/** Admin topbar bell — grouped by type (order/reservation/enquiry/customer/rate) via filter pills, since a flat 7-day feed across every event type gets unreadable fast once there's real traffic. */
export function AdminNotificationsPopover({
  notifications: notificationsProp,
}: {
  notifications: AdminNotification[];
}) {
  const [activeCategory, setActiveCategory] = useState<
    AdminNotificationCategory | "all"
  >("all");
  // Local copy so "mark as read" can update instantly instead of waiting on
  // the next 20s auto-refresh poll (see useAutoRefresh in admin-shell.tsx).
  const [notifications, setNotifications] = useState(notificationsProp);
  useEffect(() => {
    setNotifications(notificationsProp);
  }, [notificationsProp]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const countByCategory = useMemo(() => {
    const counts: Partial<Record<AdminNotificationCategory, number>> = {};
    for (const n of notifications) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  const filtered =
    activeCategory === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const result = await markNotificationReadAction(id);
    if (!result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      toast.error("Couldn't mark as read", result.error);
    }
  }

  async function handleMarkAllRead() {
    const previouslyUnread = new Set(
      notifications.filter((n) => !n.read).map((n) => n.id),
    );
    if (previouslyUnread.size === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const result = await markAllNotificationsReadAction();
    if (!result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          previouslyUnread.has(n.id) ? { ...n, read: false } : n,
        ),
      );
      toast.error("Couldn't mark all as read", result.error);
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive"
          />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[26rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-gold-dark hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all as read
              </button>
            )}
            <Badge variant={unreadCount > 0 ? "gold" : "outline"}>
              {unreadCount} new
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? notifications.length
                : (countByCategory[tab.key] ?? 0);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  activeCategory === tab.key
                    ? "bg-gold/15 text-gold-dark"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[0.65rem]",
                      activeCategory === tab.key
                        ? "text-gold-dark/70"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {activeCategory === "all"
              ? "You're all caught up — nothing new right now."
              : "Nothing here yet."}
          </p>
        ) : (
          <ul
            data-lenis-prevent
            className="max-h-[28rem] overflow-y-auto p-2"
          >
            {filtered.map((notification) => {
              const Icon = NOTIFICATION_ICON[notification.type];
              const isDestructive = notification.severity === "destructive";
              return (
                <li
                  key={notification.id}
                  className={cn(
                    "group relative rounded-lg",
                    !notification.read && "bg-gold/[0.06]",
                  )}
                >
                  <Link
                    href={notification.href}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      !notification.read && "pr-8",
                      isDestructive
                        ? "hover:bg-destructive/5"
                        : "hover:bg-secondary/50",
                    )}
                  >
                    {!notification.read && (
                      <span
                        aria-hidden
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold"
                      />
                    )}
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isDestructive ? "text-destructive" : "text-gold",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate font-medium",
                            !notification.read && "font-semibold",
                            notification.read && "text-muted-foreground",
                            isDestructive && "text-destructive",
                          )}
                        >
                          {notification.title}
                        </span>
                        <span
                          className="shrink-0 text-[0.65rem] text-muted-foreground"
                          title={formatDateTime(notification.at)}
                        >
                          {formatRelativeTime(notification.at)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                    </span>
                  </Link>
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      aria-label="Mark as read"
                      title="Mark as read"
                      className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Check className="size-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
