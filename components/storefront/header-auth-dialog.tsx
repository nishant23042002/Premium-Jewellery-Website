"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CustomerLoginForm } from "@/components/storefront/customer-login-form";
import { CustomerSignupForm } from "@/components/storefront/customer-signup-form";
import { SITE } from "@/constants/site";
import { cn } from "@/lib/utils";

const PROMO_IMAGE =
  "https://res.cloudinary.com/thelayerco/image/upload/f_auto,q_auto,w_800/v1783788862/Ambika-Jewellers/Luxury_Indian_bridal_jewellery_d__202607112218_-_Copy_pqnwqm.jpg";

interface HeaderAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Tanishq-style login/signup modal: a promo image on one side, the auth
 * form (with a login/signup toggle) on the other. Reuses the same form
 * components as the standalone /account/login and /account/signup pages —
 * `onSuccess` closes the dialog instead of navigating, `onSwitchTo*` toggles
 * the tab instead of linking to a different page.
 */
export function HeaderAuthDialog({
  open,
  onOpenChange,
}: HeaderAuthDialogProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  // Google sign-in leaves the SPA entirely (full browser redirect), so it
  // can't rely on the dialog's onSuccess-closes-modal mechanism — instead it
  // sends the customer back to whatever page the modal was opened from.
  const pathname = usePathname();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setTab("login");
      }}
    >
      <DialogContent
        showCloseButton
        className="grid max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-3xl sm:grid-cols-2"
      >
        <DialogTitle className="sr-only">
          {tab === "login" ? "Sign in to your account" : "Create your account"}
        </DialogTitle>

        <div className="relative hidden sm:block">
          <Image
            src={PROMO_IMAGE}
            alt=""
            fill
            sizes="(min-width: 640px) 380px, 0px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="font-heading text-xl">{SITE.name}</p>
            <p className="mt-1 text-sm text-white/80">
              Sign in to track Made-to-Order pieces, save addresses, and check
              out faster.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center sm:text-left">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              {tab === "login" ? "Welcome Back" : "Welcome"}
            </p>
            <h2 className="mt-1 font-heading text-2xl">
              {tab === "login"
                ? `Welcome to ${SITE.name}!`
                : "Create Your Account"}
            </h2>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg border border-border p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={cn(
                "rounded-md py-2 transition-colors",
                tab === "login"
                  ? "bg-gold text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={cn(
                "rounded-md py-2 transition-colors",
                tab === "signup"
                  ? "bg-gold text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? (
            <CustomerLoginForm
              redirectTo={pathname}
              onSuccess={() => onOpenChange(false)}
              onSwitchToSignup={() => setTab("signup")}
              surfaceClassName="bg-popover"
            />
          ) : (
            <CustomerSignupForm
              redirectTo={pathname}
              onSuccess={() => onOpenChange(false)}
              onSwitchToLogin={() => setTab("login")}
              surfaceClassName="bg-popover"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
