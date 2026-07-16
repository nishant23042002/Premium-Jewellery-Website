"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { unlinkAdminGoogleAccount } from "@/features/auth/auth.actions";
import { toast } from "@/lib/toast";
import { clientEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured for this site.",
  google_rate_limited: "Too many attempts. Please try again shortly.",
  google_invalid_state: "That link expired. Please try linking again.",
  google_email_unverified:
    "That Google account's email isn't verified — Google needs to confirm the email before it can be linked.",
  google_link_failed:
    "That Google account is already linked to a different admin.",
};

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

export function AdminGoogleLinkCard({ linked }: { linked: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUnlinking, setIsUnlinking] = useState(false);

  const error = searchParams.get("error");
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  async function handleUnlink() {
    setIsUnlinking(true);
    try {
      const result = await unlinkAdminGoogleAccount();
      if (!result.success) {
        toast.error("Couldn't unlink Google", result.error);
        return;
      }
      toast.success("Google account unlinked");
      router.refresh();
    } finally {
      setIsUnlinking(false);
    }
  }

  if (!clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in with Google</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">
            Google sign-in isn&apos;t configured for this site yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with Google</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        {linked ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="success">
                <ShieldCheck className="size-3" />
                Linked
              </Badge>
              <p className="text-sm text-muted-foreground">
                You can sign in with either your password or Google.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              {isUnlinking && <Loader2 className="size-3.5 animate-spin" />}
              Unlink Google Account
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Link your Google account for a faster sign-in. Your password
              still works either way — this only adds an option, it never
              replaces your password.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={`${ROUTES.apiAuthAdminGoogle}?mode=link`} />}
            >
              <GoogleGlyph />
              Link Google Account
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
