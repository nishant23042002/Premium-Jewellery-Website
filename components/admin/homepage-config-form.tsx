"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { FieldHelp } from "@/components/admin/field-help";
import { MediaPicker } from "@/components/admin/media-picker";
import { updateHomepageConfig } from "@/features/homepage/homepage-config.actions";
import {
  homepageConfigFormSchema,
  type HomepageConfigFormInput,
} from "@/features/homepage/homepage-config.schema";
import { toast } from "@/lib/toast";
import type { ADMIN_HELP } from "@/constants/admin-help";
import type { HomepageConfig } from "@/features/homepage/homepage-config.types";

type ImageOverrideKey =
  | "storyImageUrl"
  | "experienceVisitStoreImageUrl"
  | "experienceBookAppointmentImageUrl"
  | "experienceTalkToExpertImageUrl"
  | "experienceReadJournalImageUrl"
  | "experienceJewelleryCareImageUrl"
  | "experienceHallmarkImageUrl";

const IMAGE_OVERRIDES: { key: ImageOverrideKey; label: string }[] = [
  { key: "storyImageUrl", label: "Our Story image" },
  { key: "experienceVisitStoreImageUrl", label: "Visit Our Store tile" },
  {
    key: "experienceBookAppointmentImageUrl",
    label: "Book an Appointment tile",
  },
  { key: "experienceTalkToExpertImageUrl", label: "Talk to an Expert tile" },
  { key: "experienceReadJournalImageUrl", label: "Read Our Journal tile" },
  {
    key: "experienceJewelleryCareImageUrl",
    label: "Jewellery Care Guide tile",
  },
  { key: "experienceHallmarkImageUrl", label: "Hallmark & Certification tile" },
];

const SECTIONS: {
  key: keyof HomepageConfigFormInput;
  label: string;
  description: string;
  helpKey: keyof typeof ADMIN_HELP;
}[] = [
  {
    key: "showCollections",
    label: "Shop by Collection",
    description: "Featured collection tiles.",
    helpKey: "homepage.showCollections",
  },
  {
    key: "showCategories",
    label: "Find Your Perfect Match",
    description: "Category tiles (Necklaces, Earrings, etc.).",
    helpKey: "homepage.showCategories",
  },
  {
    key: "showOnlineExclusive",
    label: "Online Exclusive",
    description:
      'The 4 products marked "Made to Order" in Products, newest first.',
    helpKey: "homepage.showOnlineExclusive",
  },
  {
    key: "showAllProducts",
    label: "All products",
    description:
      "8 products from the full catalogue, with a link to browse everything.",
    helpKey: "homepage.showAllProducts",
  },
  {
    key: "showNewArrivals",
    label: "New arrivals",
    description: "The 4 most recently added products.",
    helpKey: "homepage.showNewArrivals",
  },
  {
    key: "showStyling",
    label: "Ways to wear it",
    description: "Editorial tiles reusing collection photos.",
    helpKey: "homepage.showStyling",
  },
  {
    key: "showStoryTeaser",
    label: "Our story",
    description: "Brand story teaser section.",
    helpKey: "homepage.showStoryTeaser",
  },
  {
    key: "showTrustBar",
    label: "Trust bar",
    description: "Hallmark / pricing / trust badges row.",
    helpKey: "homepage.showTrustBar",
  },
  {
    key: "showExperience",
    label: "Visit / Book / WhatsApp",
    description: "3-tile experience section near the bottom.",
    helpKey: "homepage.showExperience",
  },
  {
    key: "showTestimonials",
    label: "Testimonials",
    description: "Customer testimonials strip.",
    helpKey: "homepage.showTestimonials",
  },
];

export function HomepageConfigForm({ config }: { config: HomepageConfig }) {
  const router = useRouter();

  const form = useForm<HomepageConfigFormInput>({
    resolver: zodResolver(homepageConfigFormSchema),
    defaultValues: {
      showTrustBar: config.showTrustBar,
      showCollections: config.showCollections,
      showCategories: config.showCategories,
      showOnlineExclusive: config.showOnlineExclusive,
      showAllProducts: config.showAllProducts,
      showNewArrivals: config.showNewArrivals,
      showStyling: config.showStyling,
      showStoryTeaser: config.showStoryTeaser,
      showExperience: config.showExperience,
      showTestimonials: config.showTestimonials,
      storyImageUrl: config.storyImageUrl ?? "",
      experienceVisitStoreImageUrl: config.experienceVisitStoreImageUrl ?? "",
      experienceBookAppointmentImageUrl:
        config.experienceBookAppointmentImageUrl ?? "",
      experienceTalkToExpertImageUrl:
        config.experienceTalkToExpertImageUrl ?? "",
      experienceReadJournalImageUrl: config.experienceReadJournalImageUrl ?? "",
      experienceJewelleryCareImageUrl:
        config.experienceJewelleryCareImageUrl ?? "",
      experienceHallmarkImageUrl: config.experienceHallmarkImageUrl ?? "",
    },
  });

  async function onSubmit(values: HomepageConfigFormInput) {
    const result = await updateHomepageConfig(values);
    if (!result.success) {
      toast.error("Couldn't save", result.error);
      return;
    }
    toast.success("Homepage updated");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <Card>
          <CardContent className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Override the photos used in the &ldquo;Our Story&rdquo; and
              &ldquo;Shree Ambika Experience&rdquo; sections. Leave unset to
              keep the default image.
            </p>
            {IMAGE_OVERRIDES.map(({ key, label }) => {
              const value = form.watch(key);
              return (
                <div
                  key={key}
                  className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {value ? (
                        <Image
                          src={value}
                          alt={`Current ${label} image`}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <Label>{label}</Label>
                  </div>
                  <MediaPicker
                    value={value}
                    onSelect={(asset) =>
                      form.setValue(key, asset.url, { shouldDirty: true })
                    }
                    triggerLabel={value ? "Change" : "Choose"}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Toggle sections on/off — the hero and CTA banner are always shown.
            </p>
            {SECTIONS.map((section) => (
              <FormField
                key={section.key}
                control={form.control}
                name={section.key}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <FormLabel className="inline-flex items-center gap-1.5">
                        {section.label}
                        <FieldHelp helpKey={section.helpKey} />
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="gold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Save Homepage
        </Button>
      </form>
    </Form>
  );
}
