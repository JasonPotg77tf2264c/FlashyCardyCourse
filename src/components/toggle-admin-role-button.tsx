"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleAdminRoleAction } from "@/actions/admin";

interface ToggleAdminRoleButtonProps {
  targetUserId: string;
  targetUserName: string;
  isAdmin: boolean;
  isSelf: boolean;
}

export function ToggleAdminRoleButton({
  targetUserId,
  targetUserName,
  isAdmin,
  isSelf,
}: ToggleAdminRoleButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isSelf) return null;

  function handleToggle() {
    startTransition(async () => {
      await toggleAdminRoleAction({
        targetUserId,
        targetUserName,
        grant: !isAdmin,
      });
    });
  }

  return (
    <Button
      variant={isAdmin ? "destructive" : "outline"}
      size="xs"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "…" : isAdmin ? "Revoke Admin" : "Grant Admin"}
    </Button>
  );
}
