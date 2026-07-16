import Link from "next/link";
import { Phone } from "lucide-react";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { Reveal } from "@/components/motion/reveal";
import { ROUTES, SITE } from "@/constants";
import { t } from "@/lib/i18n/dictionary";
import { getStorefrontLocale } from "@/lib/i18n/locale";

interface CtaBannerProps {
  title?: string;
  description?: string;
}

/** Recurring closing section — "come see it in person" (PRD §6/§23). Used across most pages. */
export async function CtaBanner({ title, description }: CtaBannerProps) {
  const locale = await getStorefrontLocale();
  const resolvedTitle = title ?? t("seeItInPerson", locale);
  const resolvedDescription = description ?? t("seeItInPersonDesc", locale);

  return (
    <section className="section gradient-gold-animated my-10">
      <Container className="flex flex-col items-center gap-6 text-center">
        <Reveal
          direction="scale"
          className="my-10 flex flex-col items-center gap-4"
        >
          <h2 className="font-heading text-3xl text-gold-foreground">
            {resolvedTitle}
          </h2>
          <p className="max-w-lg text-sm text-gold-foreground/80">
            {resolvedDescription}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Button
                size="lg"
                className="bg-gold-foreground text-gold hover:bg-gold-foreground/90"
                nativeButton={false}
                render={
                  <Link href={ROUTES.reservation}>
                    {t("bookAVisit", locale)}
                  </Link>
                }
              />
            </Magnetic>
            <Button
              variant="outline"
              size="lg"
              className="border-gold-foreground/40 text-gold-foreground hover:bg-gold-foreground/10"
              nativeButton={false}
              render={
                <a href={`tel:${SITE.phone}`}>
                  <Phone className="size-4" />
                  {SITE.phoneDisplay}
                </a>
              }
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
