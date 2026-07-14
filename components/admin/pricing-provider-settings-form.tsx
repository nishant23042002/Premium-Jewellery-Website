"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  refreshRatesNow,
  updateProviderSettings,
  type MetalRateProviderConfig,
} from "@/features/metal-rates/metal-rate-sync.actions";
import { formatDate } from "@/lib/utils/format";
import { toast } from "@/lib/toast";

const REFRESH_INTERVAL_OPTIONS = [
  { value: "1", label: "Every hour" },
  { value: "2", label: "Every 2 hours" },
  { value: "4", label: "Every 4 hours" },
  { value: "6", label: "Every 6 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Once a day" },
];

const settingsFormSchema = z.object({
  enabled: z.boolean(),
  refreshIntervalHours: z.coerce.number().int().min(1).max(24),
  goldFactor: z.coerce.number().positive().max(1),
  silverFactor: z.coerce.number().positive().max(1),
  platinumFactor: z.coerce.number().positive().max(1),
});

type SettingsFormInput = z.input<typeof settingsFormSchema>;

/** Provider on/off, refresh cadence, and karat/purity conversion factors — plus a manual "Refresh Now" and the last-fetch status the cron route and this button both update. */
export function PricingProviderSettingsForm({
  config,
  apiKeyConfigured,
}: {
  config: MetalRateProviderConfig;
  apiKeyConfigured: boolean;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const form = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      enabled: config.enabled,
      refreshIntervalHours: config.refreshIntervalHours,
      goldFactor: config.purityFactors.gold,
      silverFactor: config.purityFactors.silver,
      platinumFactor: config.purityFactors.platinum,
    },
  });

  async function onSubmit(values: SettingsFormInput) {
    const parsed = settingsFormSchema.parse(values);
    const result = await updateProviderSettings({
      enabled: parsed.enabled,
      refreshIntervalHours: parsed.refreshIntervalHours,
      purityFactors: {
        gold: parsed.goldFactor,
        silver: parsed.silverFactor,
        platinum: parsed.platinumFactor,
      },
    });
    if (!result.success) {
      toast.error("Couldn't save settings", result.error);
      return;
    }
    toast.success("Pricing provider settings saved");
    router.refresh();
  }

  function handleRefreshNow() {
    startRefresh(async () => {
      const result = await refreshRatesNow();
      if (!result.success) {
        toast.error("Refresh failed", result.error);
        return;
      }
      toast.success(
        "Rates refreshed",
        result.warnings?.length
          ? result.warnings.join(" · ")
          : `Updated: ${result.updated?.join(", ")}`,
      );
      router.refresh();
    });
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Live Rate Provider</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefreshNow}
          disabled={isRefreshing || !apiKeyConfigured}
        >
          {isRefreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh Now
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiKeyConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              No METALS_DEV_API_KEY configured — auto-fetch and manual
              refresh are both unavailable until it&apos;s set. Manual rate
              entry below still works normally.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">API status</span>
          {config.lastFetch.status === "never" ? (
            <Badge variant="outline">Never fetched</Badge>
          ) : config.lastFetch.status === "success" ? (
            <span className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-3.5" />
              Healthy
              {config.lastFetch.at && (
                <span className="text-muted-foreground">
                  · {formatDate(config.lastFetch.at)}
                </span>
              )}
            </span>
          ) : (
            <span
              className="flex max-w-72 items-center gap-1.5 truncate text-destructive"
              title={config.lastFetch.error}
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              Failed
              {config.lastFetch.at && (
                <span className="text-muted-foreground">
                  · {formatDate(config.lastFetch.at)}
                </span>
              )}
            </span>
          )}
        </div>
        {config.lastFetch.warnings && config.lastFetch.warnings.length > 0 && (
          <ul className="list-disc space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 pl-6 text-xs text-amber-700 dark:text-amber-400">
            {config.lastFetch.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        {config.lastFetch.status === "error" && config.lastFetch.error && (
          <p className="text-xs text-destructive">{config.lastFetch.error}</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-fetch-enabled">Automatic updates</Label>
                <p className="text-xs text-muted-foreground">
                  Fetch live rates from metals.dev on the schedule below.
                </p>
              </div>
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <Switch
                    id="auto-fetch-enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!apiKeyConfigured}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="refreshIntervalHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh interval</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => v && field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REFRESH_INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="mb-2 block">
                Purity conversion factors
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                metals.dev quotes fine (24K gold / 999 silver &amp;
                platinum) spot prices — these factors convert to what the
                store actually sells (e.g. 22K gold ≈ 0.9167).
              </p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="goldFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Gold (22K)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          value={
                            typeof field.value === "number" ||
                            typeof field.value === "string"
                              ? field.value
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="silverFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Silver (999)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          value={
                            typeof field.value === "number" ||
                            typeof field.value === "string"
                              ? field.value
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platinumFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Platinum (950)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          value={
                            typeof field.value === "number" ||
                            typeof field.value === "string"
                              ? field.value
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save Provider Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
