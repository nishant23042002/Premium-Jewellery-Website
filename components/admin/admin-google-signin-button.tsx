"use client";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

/** Renders nothing when Google OAuth isn't configured — see components/storefront/google-signin-button.tsx for the customer-side twin this mirrors. Always mode=login: this button is only ever used on the admin login page, never for linking (that's AdminGoogleLinkCard, from an already-authenticated Settings page). */
export function AdminGoogleSignInButton() {
  if (!clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <Button
      variant="outline"
      className="w-full"
      nativeButton={false}
      render={<a href={`${ROUTES.apiAuthAdminGoogle}?mode=login`} />}
    >
      <GoogleGlyph />
      Continue with Google
    </Button>
  );
}

export function AdminAuthDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">
          Or continue with email
        </span>
      </div>
    </div>
  );
}
