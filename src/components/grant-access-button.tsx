"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleAdminGrantAction } from "@/actions/admin";

interface GrantAccessButtonProps {
  targetUserId: string;
  adminGranted: boolean;
  isPaidPro: boolean;
  isSelf: boolean;
}

export function GrantAccessButton({
  targetUserId,
  adminGranted,
  isPaidPro,
  isSelf,
}: GrantAccessButtonProps) {
  const [isPending, startTransition] = useTransition();

  // Don't show a toggle for paying subscribers (they already have Pro via
  // Clerk Billing) or for the admin's own row.
  if (isSelf || isPaidPro) return null;

  function handleToggle() {
    startTransition(async () => {
      await toggleAdminGrantAction({ targetUserId, grant: !adminGranted });
    });
  }

  return (
    <Button
      variant={adminGranted ? "destructive" : "outline"}
      size="xs"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "…" : adminGranted ? "Revoke" : "Grant Pro"}
    </Button>
  );
}
